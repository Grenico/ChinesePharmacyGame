<template>
  <div class="app">
    <!-- 积分提示 -->
    <div v-for="(popup, index) in scorePopups" :key="index" class="score-popup" :style="{
      left: popup.x + 'px',
      top: popup.y + 'px',
      animationDelay: popup.delay + 's'
    }">
      {{ popup.score > 0 ? '+' + popup.score : popup.score }}
    </div>
    
    <!-- 游戏标题界面 -->
    <div v-if="gameState === 'title'" class="title-screen">
      <div class="title-container">
        <h1>{{ translations[currentLanguage].gameTitle }}</h1>
        <p>{{ translations[currentLanguage].gameSubtitle }}</p>
        <div class="button-container">
          <button @click="startGame()" @mouseenter="playSound('hover')" class="start-button">{{ translations[currentLanguage].startGame }}</button>
          <button @click="showSettings = true; playSound('click')" @mouseenter="playSound('hover')" class="settings-button">{{ translations[currentLanguage].settings }}</button>
          <div class="language-button-container">
            <button @click="toggleLanguageMenu()" @mouseenter="playSound('hover')" class="language-button">{{ translations[currentLanguage].language }}</button>
            <div v-if="showLanguageMenu" class="language-dropdown">
              <div v-for="lang in languages" :key="lang.code" @click="changeLanguage(lang.code); playSound('click')" @mouseenter="playSound('hover')" class="language-option">
                {{ lang.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置页面 -->
    <div v-if="showSettings" class="settings-screen">
      <div class="settings-container">
        <h2>{{ translations[currentLanguage].gameSettings }}</h2>
        <div class="settings-content">
          <div class="setting-item">
            <label>{{ translations[currentLanguage].gameTime }}：</label>
            <div class="time-input">
              <input type="number" v-model.number="gameSettings.gameTimeMinutes" min="0" max="99" style="width: 60px; margin-right: 10px;">
              <span>{{ translations[currentLanguage].minutes }}</span>
              <input type="number" v-model.number="gameSettings.gameTimeSeconds" min="0" max="59" style="width: 60px; margin: 0 10px;">
              <span>{{ translations[currentLanguage].seconds }}</span>
            </div>
          </div>
          <div class="setting-item">
            <label>{{ translations[currentLanguage].maxOrders }}：</label>
            <input type="number" v-model.number="gameSettings.maxOrders" min="1" max="9" style="width: 60px; margin-left: 10px;">
          </div>
        </div>
        <div class="settings-buttons">
          <button @click="resetSettings" @mouseenter="playSound('hover')" class="reset-button">{{ translations[currentLanguage].resetDefaults }}</button>
          <button @click="() => { saveAndCloseSettings(); playSound('click'); }" @mouseenter="playSound('hover')" class="save-button">{{ translations[currentLanguage].saveSettings }}</button>
        </div>
        <div v-if="settingsSaved" class="settings-message">{{ translations[currentLanguage].settingsSaved }}</div>
      </div>
    </div>

    <!-- 游戏规则界面 -->
    <div v-if="showTutorial" class="tutorial-screen">
      <div class="tutorial-container">
        <h2>{{ translations[currentLanguage].gameRules }}</h2>
        <div class="tutorial-content">
          <p v-for="(rule, index) in translations[currentLanguage].gameRulesContent" :key="index">{{ rule }}</p>
        </div>
        <button @click="showTutorial = false; playSound('click')" @mouseenter="playSound('hover')" class="back-button">{{ translations[currentLanguage].back }}</button>
      </div>
    </div>

    <!-- 汉字知识界面 -->
    <div v-if="showChineseKnowledge" class="chinese-knowledge-screen">
      <div class="chinese-knowledge-container">
        <h2>{{ translations[currentLanguage].chineseKnowledgeTitle }}</h2>
        <div class="chinese-knowledge-content">
          <h3>{{ translations[currentLanguage].chineseKnowledgeContent.basicStrokes }}</h3>
          <p>{{ translations[currentLanguage].chineseKnowledgeContent.basicStrokesDesc }}</p>
          <ul>
            <li v-for="(stroke, index) in translations[currentLanguage].chineseKnowledgeContent.strokeTypes" :key="index">{{ stroke }}</li>
          </ul>

          <h3>{{ translations[currentLanguage].chineseKnowledgeContent.strokeOrder }}</h3>
          <p>{{ translations[currentLanguage].chineseKnowledgeContent.strokeOrderDesc }}</p>
          <ul>
            <li v-for="(rule, index) in translations[currentLanguage].chineseKnowledgeContent.strokeRules" :key="index">{{ rule }}</li>
          </ul>
        </div>
        <button @click="showChineseKnowledge = false; playSound('click')" @mouseenter="playSound('hover')" class="back-button">{{ translations[currentLanguage].back }}</button>
      </div>
    </div>

    <!-- 游戏主界面 -->
    <div v-if="gameState === 'playing'" class="game-screen">
      <!-- 顶部信息栏 -->
      <div class="top-bar">
        <div class="time-info">{{ translations[currentLanguage].time }}：{{ formatTime(remainingTime) }}</div>
        <div class="score-info">{{ translations[currentLanguage].score }}：{{ currentScore }}</div>
      </div>

      <!-- 中药铺场景 -->
      <div class="shop-container">
        <!-- 左侧订单区 -->
        <div class="order-section">
          <h2>{{ translations[currentLanguage].currentOrders }}</h2>
          <div class="order-list">
            <div v-for="(order, index) in currentOrders" :key="index" class="order-item" :class="{ 'active': activeOrderIndex === index, 'completed': order.completed, 'danger': order.danger }" @click="selectOrder(index)" @drop="dropOrder(index)" @dragover.prevent>
              <div class="order-pinyin">{{ order.pronunciation }}</div>
              <div class="order-character">{{ order.character }}</div>
              <div class="order-status">{{ order.completed ? translations[currentLanguage].completed : translations[currentLanguage].pending }}</div>
              <div class="order-progress" v-if="!order.completed">
                <div class="order-progress-bar" :class="order.progressClass" :style="{ width: order.progress + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间操作区 -->
        <div class="main-section">
          <!-- 草药手册 -->
          <div class="herb-book" v-if="showHerbBook">
            <h3>{{ translations[currentLanguage].herbBook }}</h3>
            <div class="book-content">
              <div class="pinyin-search">
                <label for="book-pinyin">{{ translations[currentLanguage].pinyin }}：</label>
                <input type="text" id="book-pinyin" v-model="bookPinyin" :placeholder="translations[currentLanguage].enterPinyin" @keyup.enter="searchCharacters">
                <button @click="searchCharacters" @mouseenter="playSound('hover')" class="search-button">{{ translations[currentLanguage].search }}</button>
              </div>
              <div class="character-results">
                <div v-for="char in searchResults" :key="char.char" class="character-option">
                  <div class="character-symbol">{{ char.char }}</div>
                  <div class="character-pinyin">{{ char.pronunciation }}</div>
                  <div class="character-recipe">
                    {{ char.char }} = {{ char.radicals.join(' + ') }}
                  </div>
                  <div class="character-strokes">
                    <span v-for="(radical, idx) in char.radicals" :key="idx">
                      {{ radical }} {{ getStrokeCount(radical) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 药柜 -->
          <div class="medicine-cabinet" v-if="showMedicineCabinet">
            <h3>{{ translations[currentLanguage].medicineCabinet }}</h3>
            <div class="cabinet-content">
              <!-- 偏旁部首柜 -->
              <div class="radical-cabinet">
                <div class="cabinet-header">
                  <h4>{{ translations[currentLanguage].radicalCabinet }}</h4>
                  <div class="stroke-input">
                    <input type="number" v-model.number="radicalStroke" min="1" max="20" @change="selectRadicalStroke(radicalStroke)" class="stroke-input-box">
                    <span class="stroke-unit">画</span>
                  </div>
                </div>
                <div class="cabinet-items" v-if="radicalItems.length > 0">
                  <div v-for="item in radicalItems" :key="item.id" class="herb-item" @mousedown="startDrag(item)" @click="selectRadical(item)" @mouseenter="playSound('hover')" draggable="true" :class="{ 'active': selectedRadical && selectedRadical.char == item.char }">
                    {{ item.char }}
                  </div>
                </div>
              </div>
              
              <!-- 部首外柜 -->
              <div class="component-cabinet">
                <div class="cabinet-header">
                  <h4>{{ translations[currentLanguage].componentCabinet }}</h4>
                  <div class="stroke-input">
                    <input type="number" v-model.number="componentStroke" min="1" max="20" @change="selectComponentStroke(componentStroke)" class="stroke-input-box" :disabled="!selectedRadical">
                    <span class="stroke-unit">画</span>
                  </div>
                </div>
                <div class="cabinet-items" v-if="componentItems.length > 0">
                  <div v-for="item in componentItems" :key="item.id" class="herb-item" @mousedown="startDrag(item)" @click="addHerbToCauldron(item)" @mouseenter="playSound('hover')" draggable="true">
                    {{ item.char }}
                  </div>
                </div>
                <div class="cabinet-hint" v-if="!selectedRadical">
                  {{ translations[currentLanguage].pleaseSelectRadical }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧操作按钮 -->
        <div class="control-section">
          <button @click="toggleHerbBook(); playSound('herb-book')" @mouseenter="playSound('hover')" class="control-button">{{ translations[currentLanguage].herbBook }}</button>
          <button @click="toggleMedicineCabinet(); playSound('medicine-cabinet')" @mouseenter="playSound('hover')" class="control-button">{{ translations[currentLanguage].medicineCabinet }}</button>
          <button @click="showTutorial = true" @mouseenter="playSound('hover')" class="control-button">{{ translations[currentLanguage].gameRules }}</button>
          <button @click="showChineseKnowledge = true" @mouseenter="playSound('hover')" class="control-button">{{ translations[currentLanguage].chineseKnowledge }}</button>
        </div>
      </div>

      <!-- 熬药区（固定在底部） -->
      <div class="cooking-area">
        <div class="cooking-header">
          <h3>{{ translations[currentLanguage].cookingArea }}</h3>
        </div>
        <div class="cauldrons-container">
          <div v-for="(cauldron, index) in cauldrons" :key="index" class="cauldron-section">
            <div class="cauldron" :class="{ 'idle': cauldron.status === 'idle', 'cooking': cauldron.status === 'cooking', 'completed': cauldron.status === 'completed' }" @drop="dropHerbToCauldron($event, index)" @dragover.prevent @click="cauldron.status === 'completed' && submitOrderFromCauldron(index)">
              <div class="cauldron-content" v-if="cauldron.status === 'idle'">
                <div v-for="(herb, herbIndex) in cauldron.herbs" :key="herbIndex" class="cooking-herb" @click="removeHerbFromCauldron(index, herbIndex)">
                  {{ herb.char }}
                </div>
              </div>
              <div class="result-character" v-if="cauldron.result && cauldron.status === 'completed'" @dragstart="startDragCauldronResult(index, $event)" draggable="true">
                {{ cauldron.result }}
              </div>
              <div class="cooking-animation" v-if="cauldron.status === 'cooking'">
                <div class="loading-spinner"></div>
                <div class="cooking-progress">
                  <div class="cooking-progress-bar" :style="{ width: cauldron.progress + '%' }"></div>
                </div>
              </div>
            </div>
            <div class="cooking-controls">
              <button @click="clearCauldron(index)" @mouseenter="playSound('hover')" class="clear-button" :disabled="cauldron.status === 'cooking'">{{ translations[currentLanguage].clear }}</button>
              <button @click="cookMedicine(index)" @mouseenter="playSound('hover')" class="cook-button" :disabled="cauldron.herbs.length === 0 || cauldron.status === 'cooking'">{{ translations[currentLanguage].cook }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏结束界面 -->
    <div v-if="gameState === 'ending'" class="ending-screen">
      <div class="ending-container">
        <h2>{{ translations[currentLanguage].dayEnd }}</h2>
        <div class="ending-stats">
          <p>{{ translations[currentLanguage].completedOrders }}：{{ completedOrders }}</p>
          <p>{{ translations[currentLanguage].avgTime }}：{{ avgTime }}s</p>
          <p>{{ translations[currentLanguage].finalScore }}：{{ finalScore }}</p>
        </div>
        <div class="ending-buttons">
          <button @click="backToTitle" @mouseenter="playSound('hover')" class="title-button">{{ translations[currentLanguage].backToTitle }}</button>
          <button @click="playAgain" @mouseenter="playSound('hover')" class="title-button">{{ translations[currentLanguage].playAgain }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      // 游戏状态：title, playing, ending
      gameState: 'title',
      // 界面状态
      showTutorial: false,
      showSettings: false,
      showChineseKnowledge: false,
      // 语言相关
      showLanguageMenu: false,
      currentLanguage: localStorage.getItem('gameLanguage') || 'zh',
      // 音频相关
      audioContext: null,
      cookingSound: null,
      backgroundMusic: null,
      titleMusic: null,
      soundEnabled: true,
      soundVolume: 0.7,
      musicVolume: 0.2,
      // 音频对象缓存
      audioCache: {},
      languages: [
        { code: 'zh', name: '中文' },
        { code: 'en', name: 'English' },
        { code: 'ja', name: '日本語' },
        { code: 'ru', name: 'Русский' }
      ],
      translations: {
        zh: {
          gameTitle: '中药铺',
          gameSubtitle: '汉字偏旁部首学习游戏',
          startGame: '开始游戏',
          settings: '设置',
          language: '语言',
          gameRules: '游戏规则',
          chineseKnowledge: '汉字知识',
          herbBook: '草药手册',
          medicineCabinet: '药柜',
          time: '时间',
          score: '评分',
          currentOrders: '当前订单',
          pending: '待处理',
          completed: '已完成',
          cookingArea: '熬药区',
          idle: '空闲',
          cooking: '煎药中',
          cookingComplete: '完成',
          clear: '清空',
          cook: '煎药',
          gameSettings: '游戏设置',
          gameTime: '单局游戏时长',
          minutes: '分',
          seconds: '秒',
          maxOrders: '订单数上限',
          resetDefaults: '恢复默认',
          saveSettings: '保存设置',
          settingsSaved: '设置已保存！',
          dayEnd: '今日营业结束',
          completedOrders: '完成订单数',
          avgTime: '平均完成时间',
          finalScore: '本局评分',
          backToTitle: '返回标题',
          playAgain: '再来一局',
          gameOverScore: '本局评分',
          gameRulesContent: [
            '1. 你是一名中药铺的药剂师，需要处理每日的药品订单。',
            '2. 每个订单对应一个包含特定偏旁部首的汉字。',
            '3. 通过查询"草药手册"识别所需的偏旁部首。',
            '4. 从药柜中抓取对应"草药"（偏旁部首）。',
            '5. 按照正确步骤熬制出对应药剂（组合成完整汉字）。',
            '6. 在规定时间内完成订单提交。'
          ],
          chineseKnowledgeTitle: '汉字知识',
          chineseKnowledgeContent: {
            basicStrokes: '汉字笔画的基本构成',
            basicStrokesDesc: '汉字由基本笔画组成，常见的笔画包括：',
            strokeTypes: [
              '横（一）：从左到右的水平笔画',
              '竖（丨）：从上到下的垂直笔画',
              '撇（丿）：从右上到左下的斜笔画',
              '点（丶）：短小的点状笔画',
              '捺（乀）：从左上到右下的斜笔画'
            ],
            strokeOrder: '汉字笔顺规则',
            strokeOrderDesc: '汉字书写时遵循一定的笔顺规则：',
            strokeRules: [
              '先横后竖：先写横画，再写竖画',
              '例子：十（一、丨）、土（一、丨、一）、王（一、一、丨、一）',
              '先撇后捺：先写撇画，再写捺画',
              '例子：人（丿、乀）、八（丿、乀）、大（一、丿、乀）',
              '从上到下：按照从上到下的顺序书写',
              '例子：三（一、一、一）、川（丨、丨、丨）、主（丶、王）',
              '从左到右：按照从左到右的顺序书写',
              '例子：川（丨、丨、丨）、林（木、木）、明（日、月）',
              '先外后内：先写外框，再写内部',
              '例子：同（冂、一、口）、回（囗、口）、国（囗、玉）',
              '先中间后两边：先写中间部分，再写两边',
              '例子：小（亅、丿、丿）、水（亅、丿、乀）、火（亅、丿、乀）'
            ]
          },
          back: '返回',
          radicalCabinet: '偏旁部首柜',
          componentCabinet: '部首外柜',
          pleaseSelectRadical: '请先选择偏旁',
          pinyin: '拼音',
          enterPinyin: '输入拼音查询',
          search: '查询',
          backgroundMusicVolume: '背景音乐音量',
          soundEffectsVolume: '音效音量',
          soundEnabled: '声音开关'
        },
        en: {
          gameTitle: 'Chinese Pharmacy',
          gameSubtitle: 'Chinese Character Radical Learning Game',
          startGame: 'Play',
          settings: 'Settings',
          language: 'Language',
          gameRules: 'Game Rules',
          chineseKnowledge: 'Chinese Knowledge',
          herbBook: 'Herb Book',
          medicineCabinet: 'Medicine Cabinet',
          time: 'Time',
          score: 'Score',
          currentOrders: 'Current Orders',
          pending: 'Pending',
          completed: 'Completed',
          cookingArea: 'Cooking Area',
          idle: 'Idle',
          cooking: 'Cooking',
          cookingComplete: 'Complete',
          clear: 'Clear',
          cook: 'Cook',
          gameSettings: 'Game Settings',
          gameTime: 'Game Duration',
          minutes: 'min',
          seconds: 'sec',
          maxOrders: 'Max Orders',
          resetDefaults: 'Reset Defaults',
          saveSettings: 'Save Settings',
          settingsSaved: 'Settings saved!',
          dayEnd: 'Business Closed',
          completedOrders: 'Completed Orders',
          avgTime: 'Average Time',
          finalScore: 'Final Score',
          backToTitle: 'Back to Title',
          playAgain: 'Play Again',
          gameOverScore: 'Final Score',
          gameRulesContent: [
            '1. You are a pharmacist in a Chinese pharmacy, responsible for processing daily medicine orders.',
            '2. Each order corresponds to a Chinese character with specific radicals.',
            '3. Identify the required radicals by consulting the "Herb Book".',
            '4. Grab the corresponding "herbs" (radicals) from the medicine cabinet.',
            '5. Follow the correct steps to brew the corresponding medicine (form a complete character).',
            '6. Complete and submit orders within the specified time.'
          ],
          chineseKnowledgeTitle: 'Chinese Character Knowledge',
          chineseKnowledgeContent: {
            basicStrokes: 'Basic Composition of Chinese Character Strokes',
            basicStrokesDesc: 'Chinese characters are composed of basic strokes, including:',
            strokeTypes: [
              'Horizontal (一): Horizontal stroke from left to right',
              'Vertical (丨): Vertical stroke from top to bottom',
              'Left-falling (丿): Diagonal stroke from top-right to bottom-left',
              'Dot (丶): Short dot-like stroke',
              'Right-falling (乀): Diagonal stroke from top-left to bottom-right'
            ],
            strokeOrder: 'Chinese Character Stroke Order Rules',
            strokeOrderDesc: 'Chinese characters follow specific stroke order rules when written:',
            strokeRules: [
              'Horizontal before vertical: Write horizontal strokes before vertical strokes',
              'Examples: 十 (一, 丨), 土 (一, 丨, 一), 王 (一, 一, 丨, 一)',
              'Left-falling before right-falling: Write left-falling strokes before right-falling strokes',
              'Examples: 人 (丿, 乀), 八 (丿, 乀), 大 (一, 丿, 乀)',
              'Top to bottom: Write from top to bottom',
              'Examples: 三 (一, 一, 一), 川 (丨, 丨, 丨), 主 (丶, 王)',
              'Left to right: Write from left to right',
              'Examples: 川 (丨, 丨, 丨), 林 (木, 木), 明 (日, 月)',
              'Outside before inside: Write the outer frame before the inside',
              'Examples: 同 (冂, 一, 口), 回 (囗, 口), 国 (囗, 玉)',
              'Middle before sides: Write the middle part before the sides',
              'Examples: 小 (亅, 丿, 丿), 水 (亅, 丿, 乀), 火 (亅, 丿, 乀)'
            ]
          },
          back: 'Back',
          radicalCabinet: 'Radical Cabinet',
          componentCabinet: 'Component Cabinet',
          pleaseSelectRadical: 'Please select a radical first',
          pinyin: 'Pinyin',
          enterPinyin: 'Enter pinyin to search',
          search: 'Search',
          backgroundMusicVolume: 'Background Music Volume',
          soundEffectsVolume: 'Sound Effects Volume',
          soundEnabled: 'Sound Enabled'
        },
        ja: {
          gameTitle: '漢方薬店',
          gameSubtitle: '漢字部首学習ゲーム',
          startGame: 'プレイ',
          settings: '設定',
          language: '言語',
          gameRules: 'ゲームの遊び方',
          chineseKnowledge: '漢字のマメ知識',
          herbBook: '手帳',
          medicineCabinet: '薬棚',
          time: '時間',
          score: 'スコア',
          currentOrders: '注文リスト',
          pending: '保留中',
          completed: '完了',
          cookingArea: '調理エリア',
          idle: 'アイドル',
          cooking: '調理中',
          cookingComplete: '完了',
          clear: 'クリア',
          cook: '調理',
          gameSettings: 'ゲーム設定',
          gameTime: 'ゲーム時間',
          minutes: '分',
          seconds: '秒',
          maxOrders: '最大注文数',
          resetDefaults: 'デフォルトに戻す',
          saveSettings: '設定を保存',
          settingsSaved: '設定が保存されました！',
          dayEnd: '営業終了',
          completedOrders: '完了した注文数',
          avgTime: '平均時間',
          finalScore: '最終スコア',
          backToTitle: 'タイトルに戻る',
          playAgain: 'もう一度プレイ',
          gameOverScore: '最終スコア',
          gameRulesContent: [
            '1. あなたは漢方薬店の薬剤師で、毎日の薬の注文を処理する必要があります。',
            '2. 各注文は特定の部首を含む漢字に対応しています。',
            '3. 「手帳」を参照して必要な部首を特定します。',
            '4. 薬棚から対応する「漢方薬」（部首）を取り出します。',
            '5. 正しい手順に従って対応する薬を調合します（完全な漢字を形成します）。',
            '6. 指定された時間内に注文を完成させて提出します。'
          ],
          chineseKnowledgeTitle: '漢字のマメ知識',
          chineseKnowledgeContent: {
            basicStrokes: '漢字の筆画の基本的な構成',
            basicStrokesDesc: '漢字は基本的な筆画で構成されています。主要な筆画には次のようなものがあります：',
            strokeTypes: [
              '横（一）：左から右への水平な筆画',
              '縦（丨）：上から下への垂直な筆画',
              '撇（丿）：右上から左下への斜めの筆画',
              '点（丶）：短い点のような筆画',
              '捺（乀）：左上から右下への斜めの筆画'
            ],
            strokeOrder: '漢字の筆順の規則',
            strokeOrderDesc: '漢字を書くときは、一定の筆順の規則に従います：',
            strokeRules: [
              '先横後縦：横画を書いてから縦画を書く',
              '例：十（一、丨）、土（一、丨、一）、王（一、一、丨、一）',
              '先撇後捺：撇画を書いてから捺画を書く',
              '例：人（丿、乀）、八（丿、乀）、大（一、丿、乀）',
              '从上到下：上から下の順に書く',
              '例：三（一、一、一）、川（丨、丨、丨）、主（丶、王）',
              '从左到右：左から右の順に書く',
              '例：川（丨、丨、丨）、林（木、木）、明（日、月）',
              '先外後内：外枠を書いてから内部を書く',
              '例：同（冂、一、口）、回（囗、口）、国（囗、玉）',
              '先中间後两边：中間部分を書いてから両側を書く',
              '例：小（亅、丿、丿）、水（亅、丿、乀）、火（亅、丿、乀）'
            ]
          },
          back: '戻る',
          radicalCabinet: '部首キャビネット',
          componentCabinet: '部品キャビネット',
          pleaseSelectRadical: 'まず部首を選択してください',
          pinyin: 'ピンイン',
          enterPinyin: 'ピンインを入力して検索',
          search: '検索',
          backgroundMusicVolume: '背景音楽の音量',
          soundEffectsVolume: '効果音の音量',
          soundEnabled: '音声のオン/オフ'
        },
        ru: {
          gameTitle: 'Китайская Аптека',
          gameSubtitle: 'Игра для изучения китайских иероглифов и их частей',
          startGame: 'Начать',
          settings: 'Настройки',
          language: 'Язык',
          gameRules: 'Правила игры',
          chineseKnowledge: 'Знания о китайских иероглифах',
          herbBook: 'Книга трав',
          medicineCabinet: 'Аптечный шкаф',
          time: 'Время',
          score: 'Очки',
          currentOrders: 'Текущие заказы',
          pending: 'В ожидании',
          completed: 'Завершено',
          cookingArea: 'Зона приготовления',
          idle: 'Неактивен',
          cooking: 'Приготовление',
          cookingComplete: 'Завершено',
          clear: 'Очистить',
          cook: 'Приготовить',
          gameSettings: 'Настройки игры',
          gameTime: 'Длительность игры',
          minutes: 'мин',
          seconds: 'сек',
          maxOrders: 'Максимум заказов',
          resetDefaults: 'Сбросить к умолчанию',
          saveSettings: 'Сохранить настройки',
          settingsSaved: 'Настройки сохранены!',
          dayEnd: 'Рабочий день завершен',
          completedOrders: 'Завершенные заказы',
          avgTime: 'Среднее время',
          finalScore: 'Итоговый счет',
          backToTitle: 'Вернуться к заголовку',
          playAgain: 'Сыграть снова',
          gameOverScore: 'Итоговый счет',
          gameRulesContent: [
            '1. Вы являетесь фармацевтом в китайской аптеке и должны обрабатывать ежедневные заказы на лекарства.',
            '2. Каждый заказ соответствует китайскому иероглифу с определенными частями.',
            '3. Определите необходимые части,-consulting "Книга трав".',
            '4. Вымедите соответствующие "травы" (части) из аптечного шкафа.',
            '5. Следуйте правильным шагам для приготовления соответствующего лекарства (сформируйте полный иероглиф).',
            '6. Завершите и подайте заказы в течение указанного времени.'
          ],
          chineseKnowledgeTitle: 'Знания о китайских иероглифах',
          chineseKnowledgeContent: {
            basicStrokes: 'Базовое составление штрихов китайских иероглифов',
            basicStrokesDesc: 'Китайские иероглифы состоят из базовых штрихов, включая:',
            strokeTypes: [
              'Горизонтальный (一): Горизонтальный штрих слева направо',
              'Вертикальный (丨): Вертикальный штрих сверху вниз',
              'Левый косой (丿): Косой штрих справа сверху влево вниз',
              'Точка (丶): Короткий точечный штрих',
              'Правый косой (乀): Косой штрих слева сверху вправо вниз'
            ],
            strokeOrder: 'Правила порядка штрихов китайских иероглифов',
            strokeOrderDesc: 'При написании китайских иероглифов следует определенным правилам порядка штрихов:',
            strokeRules: [
              'Горизонтальный перед вертикальным: Напишите горизонтальные штрихи перед вертикальными',
              'Примеры: 十 (一, 丨), 土 (一, 丨, 一), 王 (一, 一, 丨, 一)',
              'Левый косой перед правым косым: Напишите левые косые штрихи перед правыми косыми',
              'Примеры: 人 (丿, 乀), 八 (丿, 乀), 大 (一, 丿, 乀)',
              'Сверху вниз: Пишите сверху вниз',
              'Примеры: 三 (一, 一, 一), 川 (丨, 丨, 丨), 主 (丶, 王)',
              'Слева направо: Пишите слева направо',
              'Примеры: 川 (丨, 丨, 丨), 林 (木, 木), 明 (日, 月)',
              'Снаружи внутрь: Напишите внешнюю рамку перед внутренней частью',
              'Примеры: 同 (冂, 一, 口), 回 (囗, 口), 国 (囗, 玉)',
              'Средина перед сторонами: Напишите среднюю часть перед сторонами',
              'Примеры: 小 (亅, 丿, 丿), 水 (亅, 丿, 乀), 火 (亅, 丿, 乀)'
            ]
          },
          back: 'Вернуться',
          radicalCabinet: 'Кабинет радикалов',
          componentCabinet: 'Кабинет компонентов',
          pleaseSelectRadical: 'Пожалуйста, сначала выберите радикал',
          pinyin: 'Пиньинь',
          enterPinyin: 'Введите пиньинь для поиска',
          search: 'Поиск',
          backgroundMusicVolume: 'Громкость фоновой музыки',
          soundEffectsVolume: 'Громкость звуковых эффектов',
          soundEnabled: 'Звуки включены'
        }
      },

      // 游戏设置
      gameSettings: {
        gameTimeMinutes: 3,
        gameTimeSeconds: 30,
        maxOrders: 5
      },
      settingsSaved: false,
      // 游戏数据
      currentDay: 1,
      currentScore: 0,
      remainingTime: 210, // 3分30秒
      gameTimer: null, // 游戏计时器引用
      // 订单数据
      currentOrders: [],
      activeOrderIndex: null,
      completedOrders: 0,
      maxOrders: 5, // 最大订单数
      orderInterval: 10000, // 订单生成间隔（10秒）
      // 操作区显示状态
      showHerbBook: false,
      showMedicineCabinet: false,
      // 草药手册数据
      bookPinyin: '',
      searchResults: [],
      // 药柜数据
      activeCabinet: 'radical', // radical: 偏旁柜
      radicalStroke: 1,
      componentStroke: 1,
      radicalItems: [],
      componentItems: [],
      selectedRadical: null,
      // 熬药区数据
      // 熬药区数据
      cauldrons: [
        {
          herbs: [],
          status: 'idle', // idle, cooking, completed
          result: null,
          progress: 0,
          cookingTimer: null
        },
        {
          herbs: [],
          status: 'idle',
          result: null,
          progress: 0,
          cookingTimer: null
        },
        {
          herbs: [],
          status: 'idle',
          result: null,
          progress: 0,
          cookingTimer: null
        }
      ],
      // 拖拽数据
      draggedItem: null,
      draggedCharacter: null,

      // 积分提示数据
      scorePopups: [],
      // 游戏统计数据
      avgTime: 0,
      finalScore: 0,
      // 难度系统数据
      currentDifficulty: 1, // 当前难度等级
      usedCharacters: [], // 已使用的汉字列表
      // 汉字出现次数计数器
      characterCount: {}, // 记录每个汉字的出现次数
      // 汉字上次出现的位置
      characterLastPosition: {}, // 记录每个汉字上次出现的位置
      // 订单序列计数器
      orderSequence: 0, // 记录订单生成的序列位置
      // 偏旁部首数据
      radicals: [
        // 1画
        { id: 1, char: '一', name: '横', strokes: 1, pronunciation: 'héng', meaning: '基本笔画' },
        { id: 2, char: '丨', name: '竖', strokes: 1, pronunciation: 'shù', meaning: '基本笔画' },
        { id: 3, char: '丿', name: '撇', strokes: 1, pronunciation: 'piě', meaning: '基本笔画' },
        { id: 4, char: '丶', name: '点', strokes: 1, pronunciation: 'diǎn', meaning: '基本笔画' },
        { id: 5, char: '乀', name: '捺', strokes: 1, pronunciation: 'nà', meaning: '基本笔画' },
        
        // 2画
        { id: 6, char: '亻', name: '单人旁', strokes: 2, pronunciation: 'dān rén páng', meaning: '与人相关' },
        { id: 7, char: '冫', name: '两点水', strokes: 2, pronunciation: 'liǎng diǎn shuǐ', meaning: '与冰相关' },
        { id: 8, char: '冖', name: '秃宝盖', strokes: 2, pronunciation: 'tū bǎo gài', meaning: '与覆盖相关' },
        { id: 9, char: '讠', name: '言字旁', strokes: 2, pronunciation: 'yán zì páng', meaning: '与言语相关' },
        { id: 10, char: '刂', name: '立刀旁', strokes: 2, pronunciation: 'lì dāo páng', meaning: '与刀相关' },
        { id: 11, char: '亠', name: '京字头', strokes: 2, pronunciation: 'jīng zì tóu', meaning: '与头部相关' },
        { id: 12, char: '勹', name: '包字头', strokes: 2, pronunciation: 'bāo zì tóu', meaning: '与包裹相关' },
        { id: 13, char: '匕', name: '匕字旁', strokes: 2, pronunciation: 'bǐ zì páng', meaning: '与勺子相关' },
        { id: 14, char: '卜', name: '卜字旁', strokes: 2, pronunciation: 'bǔ zì páng', meaning: '与占卜相关' },
        { id: 15, char: '厂', name: '厂字旁', strokes: 2, pronunciation: 'chǎng zì páng', meaning: '与房屋相关' },
        { id: 16, char: '力', name: '力字旁', strokes: 2, pronunciation: 'lì zì páng', meaning: '与力量相关' },
        { id: 17, char: '又', name: '又字旁', strokes: 2, pronunciation: 'yòu zì páng', meaning: '与手相关' },
        { id: 18, char: '人', name: '人字旁', strokes: 2, pronunciation: 'rén zì páng', meaning: '与人相关' },
        { id: 19, char: '丁', name: '丁字旁', strokes: 2, pronunciation: 'dīng zì páng', meaning: '与人口相关' },
        { id: 200, char: '阝', name: '左耳旁', strokes: 2, pronunciation: 'zuǒ ěr páng', meaning: '与山陵相关' },
        { id: 201, char: '𢆉', name: '𢆉字旁', strokes: 5, pronunciation: 'jì zì páng', meaning: '与吉祥相关' },
        { id: 202, char: '元', name: '元字旁', strokes: 4, pronunciation: 'yuán zì páng', meaning: '与开始相关' },
        { id: 203, char: '完', name: '完字旁', strokes: 7, pronunciation: 'wán zì páng', meaning: '与完整相关' },
        { id: 204, char: '可', name: '可字旁', strokes: 5, pronunciation: 'kě zì páng', meaning: '与许可相关' },
        { id: 205, char: '化', name: '化字旁', strokes: 4, pronunciation: 'huà zì páng', meaning: '与变化相关' },
        { id: 206, char: '也', name: '也字旁', strokes: 3, pronunciation: 'yě zì páng', meaning: '与同样相关' },
        { id: 207, char: '聿', name: '聿字旁', strokes: 6, pronunciation: 'yù zì páng', meaning: '与书写相关' },
        { id: 208, char: '刀', name: '刀字旁', strokes: 2, pronunciation: 'dāo zì páng', meaning: '与刀具相关' },
        { id: 209, char: '二', name: '二字旁', strokes: 2, pronunciation: 'èr zì páng', meaning: '与数字相关' },
        // 补充缺失的偏旁
        { id: 210, char: '辶', name: '走之底', strokes: 3, pronunciation: 'zǒu zhī dǐ', meaning: '与行走相关' },
        { id: 211, char: '正', name: '正字旁', strokes: 5, pronunciation: 'zhèng zì páng', meaning: '与正直相关' },
        { id: 212, char: '才', name: '才字旁', strokes: 3, pronunciation: 'cái zì páng', meaning: '与才能相关' },
        { id: 213, char: '尔', name: '尔字旁', strokes: 5, pronunciation: 'ěr zì páng', meaning: '与你相关' },
        { id: 214, char: '成', name: '成字旁', strokes: 6, pronunciation: 'chéng zì páng', meaning: '与完成相关' },
        { id: 215, char: '工', name: '工字旁', strokes: 3, pronunciation: 'gōng zì páng', meaning: '与工作相关' },
        { id: 216, char: '羊', name: '羊字旁', strokes: 6, pronunciation: 'yáng zì páng', meaning: '与羊相关' },
        { id: 217, char: '儿', name: '儿字旁', strokes: 2, pronunciation: 'ér zì páng', meaning: '与儿子相关' },
        { id: 218, char: '交', name: '交字旁', strokes: 6, pronunciation: 'jiāo zì páng', meaning: '与交往相关' },
        { id: 219, char: '圭', name: '圭字旁', strokes: 6, pronunciation: 'guī zì páng', meaning: '与玉石相关' },
        { id: 220, char: '各', name: '各字旁', strokes: 6, pronunciation: 'gè zì páng', meaning: '与各个相关' },
        { id: 221, char: '首', name: '首字旁', strokes: 9, pronunciation: 'shǒu zì páng', meaning: '与头部相关' },
        { id: 222, char: '夆', name: '夆字旁', strokes: 7, pronunciation: 'féng zì páng', meaning: '与相逢相关' },
        { id: 223, char: '同', name: '同字旁', strokes: 6, pronunciation: 'tóng zì páng', meaning: '与相同相关' },
        // 补充夕偏旁（3画）
        { id: 224, char: '夕', name: '夕字旁', strokes: 3, pronunciation: 'xī zì páng', meaning: '与晚上相关' },
        { id: 224, char: '句', name: '句字旁', strokes: 5, pronunciation: 'jù zì páng', meaning: '与句子相关' },
        // 补充𤴓偏旁（5画）
        { id: 225, char: '𤴓', name: '𤴓字旁', strokes: 5, pronunciation: 'shì zì páng', meaning: '与是相关' },

        // 补充彳偏旁（3画）
        { id: 227, char: '彳', name: '彳字旁', strokes: 3, pronunciation: 'chì zì páng', meaning: '与行走相关' },
        // 补充亍偏旁（3画）
        { id: 228, char: '亍', name: '亍字旁', strokes: 3, pronunciation: 'chù zì páng', meaning: '与行走相关' },
        // 补充古偏旁（5画）
        { id: 229, char: '古', name: '古字旁', strokes: 5, pronunciation: 'gǔ zì páng', meaning: '与古代相关' },
        { id: 225, char: '苗', name: '苗字旁', strokes: 8, pronunciation: 'miáo zì páng', meaning: '与幼苗相关' },
        { id: 226, char: '甲', name: '甲字旁', strokes: 5, pronunciation: 'jiǎ zì páng', meaning: '与甲等相关' },
        { id: 227, char: '昜', name: '昜字旁', strokes: 9, pronunciation: 'yáng zì páng', meaning: '与太阳相关' },
        { id: 228, char: '彐', name: '彐字旁', strokes: 3, pronunciation: 'jì zì páng', meaning: '与扫帚相关' },
        { id: 229, char: '务', name: '务字旁', strokes: 5, pronunciation: 'wù zì páng', meaning: '与事务相关' },
        { id: 230, char: '相', name: '相字旁', strokes: 9, pronunciation: 'xiāng zì páng', meaning: '与相互相关' },
        { id: 231, char: '青', name: '青字旁', strokes: 8, pronunciation: 'qīng zì páng', meaning: '与青色相关' },
        { id: 232, char: '耂', name: '老字头', strokes: 4, pronunciation: 'lǎo zì tóu', meaning: '与老年相关' },
        { id: 233, char: '厶', name: '私字旁', strokes: 2, pronunciation: 'sī zì páng', meaning: '与私人相关' },
        { id: 234, char: '廾', name: '廾字旁', strokes: 3, pronunciation: 'gǒng zì páng', meaning: '与拱手相关' },
        { id: 235, char: '丷', name: '八字头', strokes: 2, pronunciation: 'bā zì tóu', meaning: '与八相关' },
        { id: 236, char: '方', name: '方字旁', strokes: 4, pronunciation: 'fāng zì páng', meaning: '与方向相关' },
        { id: 237, char: '户', name: '户字旁', strokes: 4, pronunciation: 'hù zì páng', meaning: '与门户相关' },
        { id: 238, char: '每', name: '每字旁', strokes: 7, pronunciation: 'měi zì páng', meaning: '与每个相关' },
        { id: 239, char: '早', name: '早字旁', strokes: 6, pronunciation: 'zǎo zì páng', meaning: '与早晨相关' },
        { id: 240, char: '采', name: '采字旁', strokes: 8, pronunciation: 'cǎi zì páng', meaning: '与采摘相关' },
        { id: 241, char: '昜', name: '昜字旁', strokes: 9, pronunciation: 'yáng zì páng', meaning: '与太阳相关' },
        { id: 242, char: '井', name: '井字旁', strokes: 4, pronunciation: 'jǐng zì páng', meaning: '与水井相关' },
        { id: 243, char: '囱', name: '囱字旁', strokes: 7, pronunciation: 'cōng zì páng', meaning: '与烟囱相关' },
        { id: 244, char: '胡', name: '胡字旁', strokes: 9, pronunciation: 'hú zì páng', meaning: '与胡须相关' },
        { id: 245, char: '反', name: '反字旁', strokes: 4, pronunciation: 'fǎn zì páng', meaning: '与相反相关' },
        { id: 246, char: '石', name: '石字旁', strokes: 5, pronunciation: 'shí zì páng', meaning: '与石头相关' },
        { id: 247, char: '我', name: '我字旁', strokes: 7, pronunciation: 'wǒ zì páng', meaning: '与自己相关' },
        { id: 248, char: '小', name: '小字旁', strokes: 3, pronunciation: 'xiǎo zì páng', meaning: '与小相关' },
        { id: 249, char: '风', name: '风字旁', strokes: 4, pronunciation: 'fēng zì páng', meaning: '与风相关' },
        { id: 250, char: '云', name: '云字旁', strokes: 4, pronunciation: 'yún zì páng', meaning: '与云相关' },
        { id: 251, char: '田', name: '田字旁', strokes: 5, pronunciation: 'tián zì páng', meaning: '与田地相关' },
        { id: 253, char: '天', name: '天字旁', strokes: 4, pronunciation: 'tiān zì páng', meaning: '与天空相关' },
        
        // 3画
        { id: 20, char: '氵', name: '三点水', strokes: 3, pronunciation: 'sān diǎn shuǐ', meaning: '与水相关' },
        { id: 21, char: '土', name: '土字旁', strokes: 3, pronunciation: 'tǔ zì páng', meaning: '与土相关' },
        { id: 22, char: '口', name: '口字旁', strokes: 3, pronunciation: 'kǒu zì páng', meaning: '与口相关' },
        { id: 23, char: '艹', name: '草字头', strokes: 3, pronunciation: 'cǎo zì tóu', meaning: '与植物相关' },
        { id: 24, char: '尢', name: '尤字旁', strokes: 3, pronunciation: 'yóu zì páng', meaning: '与特殊相关' },
        { id: 25, char: '扌', name: '提手旁', strokes: 3, pronunciation: 'tí shǒu páng', meaning: '与手相关' },
        { id: 26, char: '彡', name: '三撇', strokes: 3, pronunciation: 'sān piě', meaning: '与毛发相关' },
        { id: 27, char: '纟', name: '绞丝旁', strokes: 3, pronunciation: 'jiǎo sī páng', meaning: '与丝线相关' },
        { id: 28, char: '犭', name: '反犬旁', strokes: 3, pronunciation: 'fǎn quǎn páng', meaning: '与动物相关' },
        { id: 29, char: '饣', name: '食字旁', strokes: 3, pronunciation: 'shí zì páng', meaning: '与食物相关' },
        { id: 30, char: '忄', name: '竖心旁', strokes: 3, pronunciation: 'shù xīn páng', meaning: '与心理相关' },
        { id: 31, char: '宀', name: '宝盖头', strokes: 3, pronunciation: 'bǎo gài tóu', meaning: '与房屋相关' },
        { id: 32, char: '广', name: '广字旁', strokes: 3, pronunciation: 'guǎng zì páng', meaning: '与房屋相关' },
        { id: 33, char: '门', name: '门字旁', strokes: 3, pronunciation: 'mén zì páng', meaning: '与门户相关' },
        { id: 34, char: '巾', name: '巾字旁', strokes: 3, pronunciation: 'jīn zì páng', meaning: '与布帛相关' },
        { id: 35, char: '山', name: '山字旁', strokes: 3, pronunciation: 'shān zì páng', meaning: '与山相关' },
        { id: 36, char: '马', name: '马字旁', strokes: 3, pronunciation: 'mǎ zì páng', meaning: '与马相关' },
        { id: 37, char: '女', name: '女字旁', strokes: 3, pronunciation: 'nǚ zì páng', meaning: '与女性相关' },
        { id: 38, char: '子', name: '子字旁', strokes: 3, pronunciation: 'zǐ zì páng', meaning: '与子女相关' },
        { id: 39, char: '弓', name: '弓字旁', strokes: 3, pronunciation: 'gōng zì páng', meaning: '与弓箭相关' },
        { id: 40, char: '尸', name: '尸字旁', strokes: 3, pronunciation: 'shī zì páng', meaning: '与身体相关' },
        { id: 41, char: '己', name: '己字旁', strokes: 3, pronunciation: 'jǐ zì páng', meaning: '与自己相关' },
        { id: 42, char: '已', name: '已字旁', strokes: 3, pronunciation: 'yǐ zì páng', meaning: '与已经相关' },
        { id: 43, char: '巳', name: '巳字旁', strokes: 3, pronunciation: 'sì zì páng', meaning: '与地支相关' },
        { id: 44, char: '戈', name: '戈字旁', strokes: 4, pronunciation: 'gē zì páng', meaning: '与武器相关' },
        { id: 45, char: '弋', name: '弋字旁', strokes: 3, pronunciation: 'yì zì páng', meaning: '与射猎相关' },
        { id: 46, char: '小', name: '小字旁', strokes: 3, pronunciation: 'xiǎo zì páng', meaning: '与小相关' },
        { id: 47, char: '大', name: '大字旁', strokes: 3, pronunciation: 'dà zì páng', meaning: '与大相关' },
        { id: 48, char: '寸', name: '寸字旁', strokes: 3, pronunciation: 'cùn zì páng', meaning: '与长度相关' },
        { id: 49, char: '乞', name: '乞字旁', strokes: 3, pronunciation: 'qǐ zì páng', meaning: '与乞求相关' },
        
        // 4画
        { id: 50, char: '木', name: '木字旁', strokes: 4, pronunciation: 'mù zì páng', meaning: '与树木相关' },
        { id: 51, char: '火', name: '火字旁', strokes: 4, pronunciation: 'huǒ zì páng', meaning: '与火相关' },
        { id: 52, char: '日', name: '日字旁', strokes: 4, pronunciation: 'rì zì páng', meaning: '与日相关' },
        { id: 53, char: '月', name: '月字旁', strokes: 4, pronunciation: 'yuè zì páng', meaning: '与月亮或身体相关' },
        { id: 54, char: '心', name: '心字旁', strokes: 4, pronunciation: 'xīn zì páng', meaning: '与心理相关' },
        { id: 55, char: '车', name: '车字旁', strokes: 4, pronunciation: 'chē zì páng', meaning: '与车辆相关' },
        { id: 56, char: '手', name: '手字旁', strokes: 4, pronunciation: 'shǒu zì páng', meaning: '与手相关' },
        { id: 57, char: '王', name: '王字旁', strokes: 4, pronunciation: 'wáng zì páng', meaning: '与玉石相关' },
        { id: 58, char: '玉', name: '玉字旁', strokes: 5, pronunciation: 'yù zì páng', meaning: '与玉石相关' },
        { id: 59, char: '犬', name: '犬字旁', strokes: 4, pronunciation: 'quǎn zì páng', meaning: '与狗相关' },
        { id: 60, char: '歹', name: '歹字旁', strokes: 4, pronunciation: 'dǎi zì páng', meaning: '与死亡相关' },
        { id: 61, char: '比', name: '比字旁', strokes: 4, pronunciation: 'bǐ zì páng', meaning: '与比较相关' },
        { id: 62, char: '毛', name: '毛字旁', strokes: 4, pronunciation: 'máo zì páng', meaning: '与毛发相关' },
        { id: 63, char: '片', name: '片字旁', strokes: 4, pronunciation: 'piàn zì páng', meaning: '与片状物相关' },
        { id: 64, char: '斤', name: '斤字旁', strokes: 4, pronunciation: 'jīn zì páng', meaning: '与重量相关' },
        { id: 65, char: '爪', name: '爪字旁', strokes: 4, pronunciation: 'zhuǎ zì páng', meaning: '与手爪相关' },
        { id: 66, char: '父', name: '父字旁', strokes: 4, pronunciation: 'fù zì páng', meaning: '与父亲相关' },
        { id: 67, char: '爫', name: '爪字头', strokes: 4, pronunciation: 'zhuǎ zì tóu', meaning: '与手爪相关' },
        { id: 68, char: '牛', name: '牛字旁', strokes: 4, pronunciation: 'niú zì páng', meaning: '与牛相关' },
        { id: 69, char: '攵', name: '反文旁', strokes: 4, pronunciation: 'fǎn wén páng', meaning: '与击打相关' },
        { id: 70, char: '文', name: '文字旁', strokes: 4, pronunciation: 'wén zì páng', meaning: '与文字相关' },
        { id: 71, char: '礻', name: '示字旁', strokes: 4, pronunciation: 'shì zì páng', meaning: '与祭祀相关' },
        { id: 72, char: '畐', name: '畐字旁', strokes: 9, pronunciation: 'fú zì páng', meaning: '与福气相关' },
        { id: 73, char: '辛', name: '辛字旁', strokes: 7, pronunciation: 'xīn zì páng', meaning: '与辛苦相关' },
        { id: 74, char: '夬', name: '夬字旁', strokes: 4, pronunciation: 'guài zì páng', meaning: '与决断相关' },
        { id: 75, char: '隶', name: '隶字旁', strokes: 8, pronunciation: 'lì zì páng', meaning: '与隶属相关' },
        
        // 5画及以上
        { id: 76, char: '鸟', name: '鸟字旁', strokes: 5, pronunciation: 'niǎo zì páng', meaning: '与鸟类相关' },
        { id: 77, char: '田', name: '田字旁', strokes: 5, pronunciation: 'tián zì páng', meaning: '与田地相关' },
        { id: 78, char: '白', name: '白字旁', strokes: 5, pronunciation: 'bái zì páng', meaning: '与白色相关' },
        { id: 79, char: '皮', name: '皮字旁', strokes: 5, pronunciation: 'pí zì páng', meaning: '与皮肤相关' },
        { id: 80, char: '皿', name: '皿字旁', strokes: 5, pronunciation: 'mǐn zì páng', meaning: '与器皿相关' },
        { id: 81, char: '目', name: '目字旁', strokes: 5, pronunciation: 'mù zì páng', meaning: '与眼睛相关' },
        { id: 82, char: '石', name: '石字旁', strokes: 5, pronunciation: 'shí zì páng', meaning: '与石头相关' },
        { id: 83, char: '矢', name: '矢字旁', strokes: 5, pronunciation: 'shǐ zì páng', meaning: '与箭相关' },
        { id: 84, char: '禾', name: '禾字旁', strokes: 5, pronunciation: 'hé zì páng', meaning: '与庄稼相关' },
        { id: 85, char: '穴', name: '穴字头', strokes: 5, pronunciation: 'xué zì tóu', meaning: '与洞穴相关' },
        { id: 86, char: '立', name: '立字旁', strokes: 5, pronunciation: 'lì zì páng', meaning: '与站立相关' },
        { id: 87, char: '疒', name: '病字旁', strokes: 5, pronunciation: 'bìng zì páng', meaning: '与疾病相关' },
        { id: 88, char: '衤', name: '衣字旁', strokes: 5, pronunciation: 'yī zì páng', meaning: '与衣服相关' },
        { id: 89, char: '虫', name: '虫字旁', strokes: 6, pronunciation: 'chóng zì páng', meaning: '与昆虫相关' },
        { id: 90, char: '缶', name: '缶字旁', strokes: 6, pronunciation: 'fǒu zì páng', meaning: '与容器相关' },
        { id: 91, char: '舌', name: '舌字旁', strokes: 6, pronunciation: 'shé zì páng', meaning: '与舌头相关' },
        { id: 92, char: '竹', name: '竹字头', strokes: 6, pronunciation: 'zhú zì tóu', meaning: '与竹子相关' },
        { id: 93, char: '米', name: '米字旁', strokes: 6, pronunciation: 'mǐ zì páng', meaning: '与粮食相关' },
        { id: 94, char: '糸', name: '糸字旁', strokes: 6, pronunciation: 'mì zì páng', meaning: '与丝线相关' },
        { id: 95, char: '缶', name: '缶字旁', strokes: 6, pronunciation: 'fǒu zì páng', meaning: '与容器相关' },
        { id: 96, char: '足', name: '足字旁', strokes: 7, pronunciation: 'zú zì páng', meaning: '与脚相关' },
        { id: 97, char: '言', name: '言字旁', strokes: 7, pronunciation: 'yán zì páng', meaning: '与言语相关' },
        { id: 98, char: '角', name: '角字旁', strokes: 7, pronunciation: 'jiǎo zì páng', meaning: '与角相关' },
        { id: 99, char: '雨', name: '雨字头', strokes: 8, pronunciation: 'yǔ zì tóu', meaning: '与雨水相关' },
        { id: 100, char: '金', name: '金字旁', strokes: 8, pronunciation: 'jīn zì páng', meaning: '与金属相关' },
        { id: 101, char: '鱼', name: '鱼字旁', strokes: 8, pronunciation: 'yú zì páng', meaning: '与鱼相关' },
        { id: 102, char: '革', name: '革字旁', strokes: 9, pronunciation: 'gé zì páng', meaning: '与皮革相关' },
        { id: 103, char: '骨', name: '骨字旁', strokes: 9, pronunciation: 'gǔ zì páng', meaning: '与骨骼相关' },
        { id: 104, char: '鬼', name: '鬼字旁', strokes: 9, pronunciation: 'guǐ zì páng', meaning: '与鬼怪相关' },
        { id: 105, char: '食', name: '食字旁', strokes: 9, pronunciation: 'shí zì páng', meaning: '与食物相关' },
        { id: 106, char: '音', name: '音字旁', strokes: 9, pronunciation: 'yīn zì páng', meaning: '与声音相关' },
        { id: 107, char: '页', name: '页字旁', strokes: 6, pronunciation: 'yè zì páng', meaning: '与头部相关' },
        { id: 109, char: '鹿', name: '鹿字旁', strokes: 11, pronunciation: 'lù zì páng', meaning: '与鹿相关' },
        { id: 110, char: '麻', name: '麻字旁', strokes: 11, pronunciation: 'má zì páng', meaning: '与麻相关' },
        { id: 111, char: '麦', name: '麦字旁', strokes: 7, pronunciation: 'mài zì páng', meaning: '与麦子相关' },
        { id: 112, char: '酉', name: '酉字旁', strokes: 7, pronunciation: 'yǒu zì páng', meaning: '与酒相关' },
        { id: 113, char: '豕', name: '豕字旁', strokes: 7, pronunciation: 'shǐ zì páng', meaning: '与猪相关' },
        { id: 114, char: '贝', name: '贝字旁', strokes: 4, pronunciation: 'bèi zì páng', meaning: '与钱财相关' },
        { id: 115, char: '见', name: '见字旁', strokes: 4, pronunciation: 'jiàn zì páng', meaning: '与看见相关' },
        { id: 116, char: '舟', name: '舟字旁', strokes: 6, pronunciation: 'zhōu zì páng', meaning: '与船相关' },
        { id: 117, char: '色', name: '色字旁', strokes: 6, pronunciation: 'sè zì páng', meaning: '与颜色相关' },
        { id: 118, char: '虍', name: '虎字头', strokes: 6, pronunciation: 'hǔ zì tóu', meaning: '与老虎相关' },
        { id: 119, char: '血', name: '血字旁', strokes: 6, pronunciation: 'xuè zì páng', meaning: '与血液相关' },
        { id: 120, char: '行', name: '行字旁', strokes: 6, pronunciation: 'xíng zì páng', meaning: '与行走相关' },
        { id: 121, char: '衣', name: '衣字旁', strokes: 6, pronunciation: 'yī zì páng', meaning: '与衣服相关' },
        { id: 122, char: '西', name: '西字旁', strokes: 6, pronunciation: 'xī zì páng', meaning: '与西方相关' },
        { id: 123, char: '老', name: '老字旁', strokes: 6, pronunciation: 'lǎo zì páng', meaning: '与老年相关' },
        { id: 124, char: '而', name: '而字旁', strokes: 6, pronunciation: 'ér zì páng', meaning: '与胡须相关' },
        { id: 125, char: '耒', name: '耒字旁', strokes: 6, pronunciation: 'lěi zì páng', meaning: '与农具相关' },
        { id: 126, char: '耳', name: '耳字旁', strokes: 6, pronunciation: 'ěr zì páng', meaning: '与耳朵相关' },
        { id: 127, char: '聿', name: '聿字旁', strokes: 6, pronunciation: 'yù zì páng', meaning: '与书写相关' },
        { id: 128, char: '肉', name: '肉字旁', strokes: 6, pronunciation: 'ròu zì páng', meaning: '与肉相关' },
        { id: 129, char: '臣', name: '臣字旁', strokes: 6, pronunciation: 'chén zì páng', meaning: '与臣子相关' },
        { id: 130, char: '自', name: '自字旁', strokes: 6, pronunciation: 'zì zì páng', meaning: '与自己相关' },
        { id: 131, char: '至', name: '至字旁', strokes: 6, pronunciation: 'zhì zì páng', meaning: '与到达相关' },
        { id: 132, char: '廴', name: '建之底', strokes: 2, pronunciation: 'yǐn zì dǐ', meaning: '与行走相关' }
      ],
      // 汉字数据（包含偏旁部首）
      characters: [
        // 基础汉字
        { char: '河', radicals: ['氵', '可'], pronunciation: 'hé', meaning: 'river' },
        { char: '树', radicals: ['木', '又', '寸'], pronunciation: 'shù', meaning: 'tree' },
        { char: '明', radicals: ['日', '月'], pronunciation: 'míng', meaning: 'bright' },
        { char: '花', radicals: ['艹', '化'], pronunciation: 'huā', meaning: 'flower' },
        { char: '他', radicals: ['亻', '也'], pronunciation: 'tā', meaning: 'he' },
        { char: '吃', radicals: ['口', '乞'], pronunciation: 'chī', meaning: 'eat' },
        { char: '地', radicals: ['土', '也'], pronunciation: 'dì', meaning: 'ground' },
        { char: '灯', radicals: ['火', '丁'], pronunciation: 'dēng', meaning: 'lamp' },
        // 常用汉字
        { char: '大', radicals: ['大'], pronunciation: 'dà', meaning: 'big' },
        { char: '小', radicals: ['小'], pronunciation: 'xiǎo', meaning: 'small' },
        { char: '人', radicals: ['人'], pronunciation: 'rén', meaning: 'person' },
        { char: '口', radicals: ['口'], pronunciation: 'kǒu', meaning: 'mouth' },
        { char: '日', radicals: ['日'], pronunciation: 'rì', meaning: 'sun' },
        { char: '月', radicals: ['月'], pronunciation: 'yuè', meaning: 'moon' },
        { char: '水', radicals: ['水'], pronunciation: 'shuǐ', meaning: 'water' },
        { char: '火', radicals: ['火'], pronunciation: 'huǒ', meaning: 'fire' },
        { char: '木', radicals: ['木'], pronunciation: 'mù', meaning: 'wood' },
        { char: '土', radicals: ['土'], pronunciation: 'tǔ', meaning: 'earth' },
        { char: '金', radicals: ['金'], pronunciation: 'jīn', meaning: 'gold' },
        { char: '好', radicals: ['女', '子'], pronunciation: 'hǎo', meaning: 'good' },
        { char: '生', radicals: ['生'], pronunciation: 'shēng', meaning: 'student' },
        { char: '中', radicals: ['中'], pronunciation: 'zhōng', meaning: 'middle' },
        { char: '国', radicals: ['口', '玉'], pronunciation: 'guó', meaning: 'country' },
        { char: '民', radicals: ['民'], pronunciation: 'mín', meaning: 'people' },
        { char: '天', radicals: ['天'], pronunciation: 'tiān', meaning: 'sky' },
        { char: '气', radicals: ['气'], pronunciation: 'qì', meaning: 'air' },
        { char: '山', radicals: ['山'], pronunciation: 'shān', meaning: 'mountain' },
        { char: '美', radicals: ['羊', '大'], pronunciation: 'měi', meaning: 'beautiful' },
        { char: '丽', radicals: ['丽'], pronunciation: 'lì', meaning: 'pretty' },
        { char: '幸', radicals: ['土', '𢆉'], pronunciation: 'xìng', meaning: 'lucky' },
        { char: '福', radicals: ['礻', '畐'], pronunciation: 'fú', meaning: 'blessing' },
        { char: '快', radicals: ['忄', '夬'], pronunciation: 'kuài', meaning: 'fast' },
        { char: '乐', radicals: ['乐'], pronunciation: 'lè', meaning: 'happy' },
        { char: '健', radicals: ['亻', '廴', '聿'], pronunciation: 'jiàn', meaning: 'healthy' },
        { char: '康', radicals: ['广', '隶'], pronunciation: 'kāng', meaning: 'well' },
        { char: '平', radicals: ['平'], pronunciation: 'píng', meaning: 'peaceful' },
        { char: '安', radicals: ['宀', '女'], pronunciation: 'ān', meaning: 'safe' },
        // 扩展常用汉字
        { char: '上', radicals: ['上'], pronunciation: 'shàng', meaning: 'up' },
        { char: '下', radicals: ['下'], pronunciation: 'xià', meaning: 'down' },
        { char: '左', radicals: ['左'], pronunciation: 'zuǒ', meaning: 'left' },
        { char: '右', radicals: ['右'], pronunciation: 'yòu', meaning: 'right' },
        { char: '前', radicals: ['前'], pronunciation: 'qián', meaning: 'front' },
        { char: '后', radicals: ['后'], pronunciation: 'hòu', meaning: 'back' },
        { char: '天', radicals: ['大', '一'], pronunciation: 'tiān', meaning: 'sky' },
        { char: '地', radicals: ['土', '也'], pronunciation: 'dì', meaning: 'earth' },
        { char: '人', radicals: ['人'], pronunciation: 'rén', meaning: 'person' },
        { char: '和', radicals: ['禾', '口'], pronunciation: 'hé', meaning: 'and' },
        { char: '是', radicals: ['日', '𤴓'], pronunciation: 'shì', meaning: 'yes' },
        { char: '有', radicals: ['有'], pronunciation: 'yǒu', meaning: 'have' },
        { char: '他', radicals: ['亻', '也'], pronunciation: 'tā', meaning: 'he' },
        { char: '她', radicals: ['女', '也'], pronunciation: 'tā', meaning: 'she' },
        { char: '它', radicals: ['宀', '匕'], pronunciation: 'tā', meaning: 'it' },
        { char: '你', radicals: ['亻', '尔'], pronunciation: 'nǐ', meaning: 'you' },
        { char: '们', radicals: ['亻', '门'], pronunciation: 'mén', meaning: 'we' },
        { char: '这', radicals: ['辶', '文'], pronunciation: 'zhè', meaning: 'this' },
        { char: '个', radicals: ['个'], pronunciation: 'gè', meaning: 'individual' },
        { char: '子', radicals: ['子'], pronunciation: 'zǐ', meaning: 'child' },
        { char: '儿', radicals: ['儿'], pronunciation: 'ér', meaning: 'son' },
        { char: '女', radicals: ['女'], pronunciation: 'nǚ', meaning: 'woman' },
        { char: '男', radicals: ['田', '力'], pronunciation: 'nán', meaning: 'man' },
        { char: '老', radicals: ['耂', '匕'], pronunciation: 'lǎo', meaning: 'old' },
        { char: '少', radicals: ['小', '丿'], pronunciation: 'shǎo', meaning: 'few' },
        { char: '多', radicals: ['夕', '夕'], pronunciation: 'duō', meaning: 'many' },
        { char: '来', radicals: ['来'], pronunciation: 'lái', meaning: 'come' },
        { char: '去', radicals: ['土', '厶'], pronunciation: 'qù', meaning: 'go' },
        { char: '进', radicals: ['辶', '井'], pronunciation: 'jìn', meaning: 'enter' },
        { char: '出', radicals: ['出'], pronunciation: 'chū', meaning: 'exit' },
        { char: '开', radicals: ['一', '廾'], pronunciation: 'kāi', meaning: 'open' },
        { char: '关', radicals: ['丷', '天'], pronunciation: 'guān', meaning: 'close' },
        { char: '门', radicals: ['门'], pronunciation: 'mén', meaning: 'door' },
        { char: '窗', radicals: ['穴', '囱'], pronunciation: 'chuāng', meaning: 'window' },
        { char: '房', radicals: ['户', '方'], pronunciation: 'fáng', meaning: 'room' },
        { char: '家', radicals: ['宀', '豕'], pronunciation: 'jiā', meaning: 'home' },
        { char: '校', radicals: ['木', '交'], pronunciation: 'xiào', meaning: 'school' },
        { char: '园', radicals: ['口', '元'], pronunciation: 'yuán', meaning: 'garden' },
        { char: '院', radicals: ['阝', '完'], pronunciation: 'yuàn', meaning: 'yard' },
        { char: '城', radicals: ['土', '成'], pronunciation: 'chéng', meaning: 'city' },
        { char: '市', radicals: ['亠', '巾'], pronunciation: 'shì', meaning: 'market' },
        { char: '街', radicals: ['彳', '圭', '亍'], pronunciation: 'jiē', meaning: 'street' },
        { char: '路', radicals: ['足', '各'], pronunciation: 'lù', meaning: 'road' },
        { char: '道', radicals: ['辶', '首'], pronunciation: 'dào', meaning: 'path' },
        { char: '江', radicals: ['氵', '工'], pronunciation: 'jiāng', meaning: 'river' },
        { char: '湖', radicals: ['氵', '古', '月'], pronunciation: 'hú', meaning: 'lake' },
        { char: '海', radicals: ['氵', '每'], pronunciation: 'hǎi', meaning: 'sea' },
        { char: '洋', radicals: ['氵', '羊'], pronunciation: 'yáng', meaning: 'ocean' },
        { char: '山', radicals: ['山'], pronunciation: 'shān', meaning: 'mountain' },
        { char: '峰', radicals: ['山', '夆'], pronunciation: 'fēng', meaning: 'peak' },
        { char: '岩', radicals: ['山', '石'], pronunciation: 'yán', meaning: 'rock' },
        { char: '洞', radicals: ['氵', '同'], pronunciation: 'dòng', meaning: 'cave' },
        { char: '树', radicals: ['木', '又', '寸'], pronunciation: 'shù', meaning: 'tree' },
        { char: '林', radicals: ['木', '木'], pronunciation: 'lín', meaning: 'forest' },
        { char: '森', radicals: ['木', '林'], pronunciation: 'sēn', meaning: 'woods' },
        { char: '草', radicals: ['艹', '早'], pronunciation: 'cǎo', meaning: 'grass' },
        { char: '花', radicals: ['艹', '化'], pronunciation: 'huā', meaning: 'flower' },
        { char: '鸟', radicals: ['鸟'], pronunciation: 'niǎo', meaning: 'bird' },
        { char: '鱼', radicals: ['鱼'], pronunciation: 'yú', meaning: 'fish' },
        { char: '马', radicals: ['马'], pronunciation: 'mǎ', meaning: 'horse' },
        { char: '牛', radicals: ['牛'], pronunciation: 'niú', meaning: 'cow' },
        { char: '羊', radicals: ['羊'], pronunciation: 'yáng', meaning: 'sheep' },
        { char: '狗', radicals: ['犭', '句'], pronunciation: 'gǒu', meaning: 'dog' },
        { char: '猫', radicals: ['犭', '苗'], pronunciation: 'māo', meaning: 'cat' },
        { char: '鸡', radicals: ['又', '鸟'], pronunciation: 'jī', meaning: 'chicken' },
        { char: '鸭', radicals: ['甲', '鸟'], pronunciation: 'yā', meaning: 'duck' },
        { char: '鹅', radicals: ['我', '鸟'], pronunciation: 'é', meaning: 'goose' },
        { char: '饭', radicals: ['饣', '反'], pronunciation: 'fàn', meaning: 'rice' },
        { char: '菜', radicals: ['艹', '采'], pronunciation: 'cài', meaning: 'vegetable' },
        { char: '汤', radicals: ['氵', '𠃓'], pronunciation: 'tāng', meaning: 'soup' },
        { char: '水', radicals: ['水'], pronunciation: 'shuǐ', meaning: 'water' },
        { char: '火', radicals: ['火'], pronunciation: 'huǒ', meaning: 'fire' },
        { char: '电', radicals: ['电'], pronunciation: 'diàn', meaning: 'electricity' },
        { char: '光', radicals: ['⺌', '兀'], pronunciation: 'guāng', meaning: 'light' },
        // 补充常用汉字
        { char: '风', radicals: ['风'], pronunciation: 'fēng', meaning: 'wind' },
        { char: '云', radicals: ['云'], pronunciation: 'yún', meaning: 'cloud' },
        { char: '雪', radicals: ['雨', '彐'], pronunciation: 'xuě', meaning: 'snow' },
        { char: '雷', radicals: ['雨', '田'], pronunciation: 'léi', meaning: 'thunder' },
        { char: '霜', radicals: ['雨', '相'], pronunciation: 'shuāng', meaning: 'frost' },
        { char: '雾', radicals: ['雨', '务'], pronunciation: 'wù', meaning: 'fog' },
        { char: '虹', radicals: ['虫', '工'], pronunciation: 'hóng', meaning: 'rainbow' },
        { char: '晴', radicals: ['日', '青'], pronunciation: 'qíng', meaning: 'sunny' },
        { char: '阴', radicals: ['阝', '月'], pronunciation: 'yīn', meaning: 'cloudy' }
      ],
    }
  },

  mounted() {
    this.loadSettings();
    
    // 添加全局点击事件监听器，实现点击其他位置关闭语言菜单
    document.addEventListener('click', this.handleGlobalClick);
    
    // 页面加载时初始化音频系统
    this.initAudio();
    
    // 播放标题音乐
    this.playTitleMusic();
  },
  
  beforeUnmount() {
    // 移除全局点击事件监听器
    document.removeEventListener('click', this.handleGlobalClick);
  },
  
  computed: {
    // 识别独体字（只有一个偏旁部首的汉字）
    singleRadicalCharacters() {
      return this.characters.filter(char => char.radicals.length === 1);
    },
    // 识别合体字（有多个偏旁部首的汉字）
    multiRadicalCharacters() {
      return this.characters.filter(char => char.radicals.length > 1);
    }
  },
  methods: {
    // 初始化音频系统
    initAudio() {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      this.loadCookingSound();
      this.loadSoundEffects();
      this.loadTitleMusic();
      this.loadBackgroundMusic();
    },

    // 加载烹饪音效
    loadCookingSound() {
      if (this.cookingSound) {
        return;
      }
      
      const audio = new Audio('/audio/cooking/boiling.mp3');
      audio.loop = false;
      audio.volume = this.soundVolume * 0.9;
      audio.addEventListener('canplaythrough', () => {
        console.log('烹饪音效加载完成');
      }, { once: true });
      audio.addEventListener('error', (e) => {
        console.log('烹饪音效加载失败:', e);
      });
      this.cookingSound = audio;
    },

    // 加载音效
    loadSoundEffects() {
      const sounds = [
        { key: 'button-hover', path: '/audio/sounds/button-hover.mp3' },
        { key: 'button-click', path: '/audio/sounds/button-click.mp3' },
        { key: 'cooking-complete', path: '/audio/sounds/cooking-complete.mp3' },
        { key: 'herb-book', path: '/audio/ui/herb-book.mp3' },
        { key: 'medicine-cabinet', path: '/audio/ui/medicine-cabinet.mp3' },
        { key: 'cauldron-click', path: '/audio/ui/cauldron-click.mp3' },
        { key: 'radical-click', path: '/audio/ui/radical-click.mp3' },
        { key: 'order-timeout', path: '/audio/ui/order-timeout.mp3' },
        { key: 'game-over', path: '/audio/ui/game-over.mp3' },
        { key: 'remove-herb', path: '/audio/ui/remove-herb.mp3' },
        { key: 'clear-cauldron', path: '/audio/ui/clear-cauldron.mp3' }
      ];
      
      sounds.forEach(sound => {
        if (!this.audioCache[sound.key]) {
          const audio = new Audio(sound.path);
          audio.volume = this.soundVolume;
          audio.addEventListener('canplaythrough', () => {
            console.log(`${sound.key} 音效加载完成`);
          }, { once: true });
          audio.addEventListener('error', (e) => {
            console.log(`${sound.key} 音效加载失败:`, e);
          });
          this.audioCache[sound.key] = audio;
        }
      });
    },

    // 播放烹饪音效
    playCookingSound() {
      if (!this.soundEnabled) {
        return;
      }
      
      if (this.cookingSound) {
        this.cookingSound.play().catch(e => {
          console.log('烹饪音效播放失败:', e);
        });
      }
    },

    // 停止烹饪音效
    stopCookingSound() {
      if (this.cookingSound) {
        this.cookingSound.pause();
        this.cookingSound.currentTime = 0;
      }
    },

    // 加载标题音乐
    loadTitleMusic() {
      const audio = new Audio('audio/background/title.mp3');
      audio.loop = true;
      audio.volume = this.musicVolume;
      this.titleMusic = audio;
    },
    
    // 加载背景音乐
    loadBackgroundMusic() {
      const audio = new Audio('audio/background/game-background.wav');
      audio.loop = true;
      audio.volume = this.musicVolume;
      this.backgroundMusic = audio;
    },
    
    // 播放标题音乐
    playTitleMusic() {
      if (!this.soundEnabled || !this.titleMusic) return;
      this.titleMusic.play().catch(e => {
        console.log('标题音乐播放失败:', e);
      });
    },
    
    // 停止标题音乐
    stopTitleMusic() {
      if (this.titleMusic) {
        this.titleMusic.pause();
        this.titleMusic.currentTime = 0;
      }
    },
    
    // 播放背景音乐
    playBackgroundMusic() {
      if (!this.soundEnabled || !this.backgroundMusic) return;
      this.backgroundMusic.play().catch(e => {
        console.log('背景音乐播放失败:', e);
      });
    },
    
    // 停止背景音乐
    stopBackgroundMusic() {
      if (this.backgroundMusic) {
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
      }
    },

    // 更新音量
    updateVolume() {
      if (this.cookingSound) {
        this.cookingSound.volume = this.soundVolume * 0.8;
      }
      if (this.backgroundMusic) {
        this.backgroundMusic.volume = this.musicVolume;
      }
      if (this.titleMusic) {
        this.titleMusic.volume = this.musicVolume;
      }
      Object.values(this.audioCache).forEach(audio => {
        audio.volume = this.soundVolume;
      });
    },
    
    // 切换声音开关
    toggleSound() {
      if (this.soundEnabled) {
        this.stopCookingSound();
        this.stopBackgroundMusic();
        this.stopTitleMusic();
      } else {
        if (this.gameState === 'title') {
          this.playTitleMusic();
        } else if (this.gameState === 'playing') {
          this.playBackgroundMusic();
        }
      }
    },

    // 播放音效
    playSound(type) {
      if (!this.soundEnabled) {
        return;
      }

      // 优先使用加载的音效文件
      const soundMap = {
        'hover': 'button-hover',
        'click': 'button-click',
        'cooking-complete': 'cooking-complete',
        'herb-book': 'herb-book',
        'medicine-cabinet': 'medicine-cabinet',
        'cauldron-click': 'cauldron-click',
        'radical-click': 'radical-click',
        'order-timeout': 'order-timeout',
        'game-over': 'game-over',
        'remove-herb': 'remove-herb',
        'clear-cauldron': 'clear-cauldron'
      };

      if (soundMap[type] && this.audioCache[soundMap[type]]) {
        const audio = this.audioCache[soundMap[type]];
        // 重置音频位置并播放
        audio.currentTime = 0;
        audio.play().catch(e => {
          console.log(`音效播放失败:`, e);
          // 如果音效文件播放失败，使用Web Audio API生成
          this.generateSound(type);
        });
        return;
      }

      // 使用Web Audio API生成音效作为备选
      this.generateSound(type);
    },

    // 生成音效（使用Web Audio API）
    generateSound(type) {
      if (!this.audioContext) {
        return;
      }

      const ctx = this.audioContext;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      switch (type) {
        case 'hover':
        case 'button-hover':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(400, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.1);
          break;
        case 'click':
        case 'button-click':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(600, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.15);
          break;
        case 'select':
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(500, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
        case 'success':
        case 'cooking-complete':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
          oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.5);
          oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 1.0);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.0);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 2.0);
          break;
        case 'error':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(200, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
        case 'cooking':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(300, ctx.currentTime);
          oscillator.frequency.setValueAtTime(400, ctx.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(350, ctx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;
        case 'herb-book':
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(300, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;
        case 'medicine-cabinet':
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(250, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;
        case 'cauldron-click':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(400, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.25);
          break;
        case 'radical-click':
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(350, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
        case 'order-timeout':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(400, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.4);
          break;
        case 'game-over':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(600, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.5);
          oscillator.frequency.setValueAtTime(300, ctx.currentTime + 0.5);
          oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 1.0);
          gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 1.2);
          break;
        case 'remove-herb':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(300, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
        case 'clear-cauldron':
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(250, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;
      }
    },

    // 处理全局点击事件
    handleGlobalClick(event) {
      const languageButtonContainer = event.target.closest('.language-button-container');
      if (!languageButtonContainer && this.showLanguageMenu) {
        this.showLanguageMenu = false;
      }
    },
    
    // 切换语言菜单
    toggleLanguageMenu() {
      this.showLanguageMenu = !this.showLanguageMenu;
    },
    
    // 切换语言
    changeLanguage(langCode) {
      this.currentLanguage = langCode;
      localStorage.setItem('gameLanguage', langCode);
      this.showLanguageMenu = false;
    },
    
    // 开始游戏
    startGame() {
      this.playSound('click');
      
      // 应用游戏设置
      this.remainingTime = this.gameSettings.gameTimeMinutes * 60 + this.gameSettings.gameTimeSeconds;
      this.maxOrders = Math.min(this.gameSettings.maxOrders, 9); // 确保订单上限不超过9
      
      this.gameState = 'playing';
      this.currentScore = 0;
      this.scorePopups = [];
      this.generateInitialOrders();
      this.startTimer();
      
      // 停止标题音乐，播放游戏内背景音乐
      this.stopTitleMusic();
      this.playBackgroundMusic();
      
      // 开始订单生成器
      this.startOrderGenerator();
    },

    // 重置设置
    resetSettings() {
      this.gameSettings = {
        gameTimeMinutes: 3,
        gameTimeSeconds: 30,
        maxOrders: 5
      };
      this.saveSettings();
    },

    // 加载设置
    loadSettings() {
      const savedSettings = localStorage.getItem('gameSettings');
      if (savedSettings) {
        try {
          this.gameSettings = JSON.parse(savedSettings);
        } catch (e) {
          console.error('加载设置失败:', e);
        }
      }
    },

    // 保存设置
    saveSettings() {
      try {
        localStorage.setItem('gameSettings', JSON.stringify(this.gameSettings));
      } catch (e) {
        console.error('保存设置失败:', e);
      }
    },

    // 保存并关闭设置
    saveAndCloseSettings() {
      this.saveSettings();
      this.showSettings = false;
    },

    // 生成初始订单
    generateInitialOrders() {
      this.currentOrders = [];
      // 生成2个初始订单
      this.addNewOrder();
      this.addNewOrder();
    },

    // 添加新订单
    addNewOrder() {
      if (this.currentOrders.length >= this.maxOrders) return;
      
      // 只从合体字中选择订单字符，确保独体字不出现在订单列表中
      const multiRadicalChars = this.multiRadicalCharacters;
      
      // 所有合体字都可以被选择，取消难度等级限制
      const availableChars = multiRadicalChars;
      
      // 实现汉字出现次数限制和间隔限制
      const validChars = availableChars.filter(char => {
        // 检查汉字出现次数是否不超过2次
        const charCount = this.characterCount[char.char] || 0;
        if (charCount >= 2) {
          return false;
        }
        
        // 检查同一汉字两次出现之间是否间隔至少5个其他汉字
        const lastPosition = this.characterLastPosition[char.char];
        if (lastPosition && (this.orderSequence - lastPosition) < 6) { // 间隔至少5个其他汉字，所以需要差6
          return false;
        }
        
        return true;
      });
      
      // 如果没有有效的汉字，重置计数器
      if (validChars.length === 0) {
        this.characterCount = {};
        this.characterLastPosition = {};
        validChars.push(...availableChars);
      }
      
      const randomChar = validChars[Math.floor(Math.random() * validChars.length)];
      
      // 更新汉字出现次数和位置
      this.characterCount[randomChar.char] = (this.characterCount[randomChar.char] || 0) + 1;
      this.characterLastPosition[randomChar.char] = this.orderSequence;
      this.orderSequence++;
      const now = Date.now();
      const timeoutTime = now + 120000; // 120秒超时（2分钟）
      
      this.currentOrders.push({
        id: Date.now() + Math.random(),
        character: randomChar.char,
        radicals: randomChar.radicals,
        pronunciation: randomChar.pronunciation,
        completed: false,
        startTime: now,
        endTime: null,
        timeoutTime: timeoutTime,
        progress: 100,
        progressClass: 'normal',
        danger: false,
        pauseStartTime: null,
        totalPauseDuration: 0
      });
      
      // 更新订单进度
      this.updateOrderProgress();
    },

    // 开始订单生成器
    startOrderGenerator() {
      this.orderGenerator = setInterval(() => {
        this.addNewOrder();
      }, this.orderInterval);
    },

    // 停止订单生成器
    stopOrderGenerator() {
      if (this.orderGenerator) {
        clearInterval(this.orderGenerator);
        this.orderGenerator = null;
      }
    },

    // 格式化时间为 mm:ss 格式
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // 开始计时器
    startTimer() {
      this.gameTimer = setInterval(() => {
        if (this.remainingTime > 0 && !this.showTutorial && !this.showChineseKnowledge) {
          this.remainingTime--;
          // 更新订单进度
          this.updateOrderProgress();
        } else if (this.remainingTime <= 0) {
          this.endDay();
        }
      }, 1000);
    },

    // 更新订单进度
    updateOrderProgress() {
      const now = Date.now();
      const ordersToRemove = [];
      
      this.currentOrders.forEach((order, index) => {
        if (!order.completed) {
          // 检查是否显示了教程或汉字知识界面
          if (this.showTutorial || this.showChineseKnowledge) {
            // 开始暂停
            if (!order.pauseStartTime) {
              order.pauseStartTime = now;
            }
          } else {
            // 结束暂停
            if (order.pauseStartTime) {
              order.totalPauseDuration += now - order.pauseStartTime;
              order.pauseStartTime = null;
            }
          }
          
          const totalTime = order.timeoutTime - order.startTime;
          // 计算实际流逝时间（扣除暂停时间）
          const elapsedTime = now - order.startTime - order.totalPauseDuration;
          // 计算实际剩余时间
          const remainingTime = order.timeoutTime - now + order.totalPauseDuration;
          
          // 计算进度百分比
          let progress = Math.max(0, 100 - (elapsedTime / totalTime) * 100);
          order.progress = progress;
          
          // 设置进度条状态
          if (remainingTime <= 0) {
            order.progressClass = 'danger';
            order.danger = true;
            // 订单超时，标记为失败
            ordersToRemove.push(index);
          } else if (remainingTime <= totalTime * 0.3) {
            order.progressClass = 'danger';
            order.danger = true;
          } else if (remainingTime <= totalTime * 0.5) {
            order.progressClass = 'warning';
            order.danger = false;
          } else {
            order.progressClass = 'normal';
            order.danger = false;
          }
        }
      });
      
      // 处理超时订单
      ordersToRemove.reverse().forEach(index => {
        this.handleOrderFailure(index);
      });
    },

    // 处理订单失败
    handleOrderFailure(index) {
      const order = this.currentOrders[index];
      if (order && !order.completed) {
        // 从订单列表中移除
        this.currentOrders.splice(index, 1);
        
        // 播放订单超时音效
        this.playSound('order-timeout');
        
        // 订单失败惩罚
        this.currentScore -= 200;
        
        // 显示扣分提示
        this.createScorePopup(100, 100, -200);
        
        // 调整选中索引
        if (this.activeOrderIndex === index) {
          this.activeOrderIndex = null;
        } else if (this.activeOrderIndex > index) {
          this.activeOrderIndex--;
        }
      }
    },



    // 选择订单
    selectOrder(index) {
      if (this.currentOrders[index].completed) return;
      this.activeOrderIndex = index;
    },

    // 切换草药手册
    toggleHerbBook() {
      this.showHerbBook = !this.showHerbBook;
      this.showMedicineCabinet = false;
    },

    // 切换药柜
    toggleMedicineCabinet() {
      this.showMedicineCabinet = !this.showMedicineCabinet;
      this.showHerbBook = false;
      this.openCabinetItems = [];
    },

    // 切换药柜标签
    switchCabinet(type) {
      this.activeCabinet = type;
      this.openCabinetItems = [];
    },

    // 拼音查询汉字
    searchCharacters() {
      if (!this.bookPinyin) {
        this.searchResults = [];
        return;
      }
      // 移除声调的函数
      const removeTones = (pinyin) => {
        return pinyin.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g, (match) => {
          const toneMap = {
            'ā':'a', 'á':'a', 'ǎ':'a', 'à':'a',
            'ē':'e', 'é':'e', 'ě':'e', 'è':'e',
            'ī':'i', 'í':'i', 'ǐ':'i', 'ì':'i',
            'ō':'o', 'ó':'o', 'ǒ':'o', 'ò':'o',
            'ū':'u', 'ú':'u', 'ǔ':'u', 'ù':'u',
            'ǖ':'ü', 'ǘ':'ü', 'ǚ':'ü', 'ǜ':'ü',
            'ü':'ü'
          };
          return toneMap[match] || match;
        });
      };
      
      const searchPinyin = this.bookPinyin.toLowerCase();
      const filteredChars = this.characters.filter(char => {
        const charPinyin = removeTones(char.pronunciation).toLowerCase();
        return charPinyin === searchPinyin;
      });
      
      // 去重：相同汉字只保留一个
      const uniqueCharsMap = {};
      filteredChars.forEach(char => {
        if (!uniqueCharsMap[char.char]) {
          uniqueCharsMap[char.char] = char;
        }
      });
      
      this.searchResults = Object.values(uniqueCharsMap);
    },

    // 获取笔画数
    getStrokeCount(char) {
      // 先查偏旁
      const radical = this.radicals.find(r => r.char === char);
      if (radical) return radical.strokes;
      // 查汉字（如果汉字本身就是一个部首）
      const character = this.characters.find(c => c.char === char);
      if (character && character.radicals.length === 1 && character.radicals[0] === char) {
        // 如果汉字只有一个偏旁，且就是它本身，返回合理的笔画数
        // 这里可以根据需要添加具体的笔画数映射
        const strokeMap = {
          '大': 3, '小': 3, '人': 2, '口': 3, '日': 4, '月': 4,
          '水': 4, '火': 4, '木': 4, '土': 3, '金': 8, '学': 8,
          '生': 5, '中': 4, '国': 8, '民': 5, '天': 4, '气': 4,
          '山': 3, '美': 9, '丽': 7, '幸': 8, '福': 13, '快': 7,
          '乐': 5, '健': 10, '康': 11, '平': 5, '安': 6,
          '可': 5, '对': 5, '化': 4, '也': 3, '乞': 3, '丁': 2,
          '廴': 2, '聿': 6, '羊': 6, '马': 3, '门': 3, '鸟': 5, '鱼': 8, '页': 6
        };
        return strokeMap[char] || 3;
      }
      // 为常见的部首添加笔画数映射
      const componentStrokeMap = {
        '可': 5, '对': 5, '化': 4, '也': 3, '乞': 3, '丁': 2,
        '廴': 2, '聿': 6
      };
      if (componentStrokeMap[char]) {
        return componentStrokeMap[char];
      }
      // 默认返回3画
      return 3;
    },

    // 打开药柜
    openCabinet() {
      const strokeCount = parseInt(this.cabinetStroke);
      this.openCabinetItems = this.radicals.filter(item => item.strokes === strokeCount);
    },

    // 选择偏旁笔画数
    selectRadicalStroke(n) {
      this.radicalStroke = n;
      this.radicalItems = this.radicals.filter(item => item.strokes === n);
      this.selectedRadical = null;
      this.componentItems = [];
    },

    // 选择部首笔画数
    selectComponentStroke(n) {
      if (!this.selectedRadical) {
        alert('请先选择偏旁');
        return;
      }
      this.componentStroke = n;
      // 根据选中的偏旁和笔画数筛选对应的部首
      this.filterComponents(n);
    },

    // 选择偏旁
    selectRadical(radical) {
      this.playSound('radical-click');
      this.selectedRadical = radical;
      // 自动将偏旁添加到煎药区
      this.addHerbToCauldron(radical);
      // 显示默认笔画数的部首
      this.filterComponents(this.componentStroke);
    },

    // 筛选部首
    filterComponents(strokeCount) {
      if (!this.selectedRadical) {
        this.componentItems = [];
        return;
      }
      
      // 从汉字数据中提取包含该偏旁的所有其他部分作为可能的部首
      const components = new Set();
      this.characters.forEach(char => {
        if (char.radicals.includes(this.selectedRadical.char)) {
          char.radicals.forEach(rad => {
            if (rad !== this.selectedRadical.char) {
              components.add(rad);
            }
          });
        }
      });
      
      // 将独体字也添加到部首柜中
      this.singleRadicalCharacters.forEach(char => {
        components.add(char.char);
      });
      
      // 转换为数组并筛选笔画数
      this.componentItems = Array.from(components).map(char => {
        const strokes = this.getStrokeCount(char);
        return {
          id: Date.now() + Math.random(),
          char: char,
          strokes: strokes
        };
      }).filter(item => item.strokes === strokeCount);
    },

    // 开始拖拽
    startDrag(item) {
      this.draggedItem = item;
    },

    // 放置草药到特定煎药钵
    dropHerbToCauldron(event, cauldronIndex) {
      event.preventDefault();
      if (this.draggedItem) {
        const cauldron = this.cauldrons[cauldronIndex];
        if (cauldron.status === 'idle') {
          cauldron.herbs.push(this.draggedItem);
          this.draggedItem = null;
        }
      }
    },

    // 抓取草药
    grabHerb(item) {
      // 找到第一个空闲的煎药钵
      const idleCauldron = this.cauldrons.find(cauldron => cauldron.status === 'idle');
      if (idleCauldron) {
        idleCauldron.herbs.push(item);
      }
    },

    // 点击添加草药到煎药区
    addHerbToCauldron(item) {
      this.playSound('radical-click');
      // 优先找到已经有部首的空闲煎药钵
      let targetCauldron = this.cauldrons.find(cauldron => 
        cauldron.status === 'idle' && cauldron.herbs.length > 0
      );
      
      // 如果没有找到有部首的煎药钵，再找第一个空闲的煎药钵
      if (!targetCauldron) {
        targetCauldron = this.cauldrons.find(cauldron => cauldron.status === 'idle');
      }
      
      if (targetCauldron) {
        targetCauldron.herbs.push(item);
      }
    },

    // 直接提交订单（点击完成品）
    submitOrderFromCauldron(cauldronIndex) {
      const cauldron = this.cauldrons[cauldronIndex];
      if (!cauldron.result) return;
      
      // 查找匹配的未完成订单
      const matchingOrderIndex = this.currentOrders.findIndex(order => 
        !order.completed && order.character === cauldron.result
      );
      
      if (matchingOrderIndex !== -1) {
        this.playSound('cauldron-click');
        const matchingOrder = this.currentOrders[matchingOrderIndex];
        const orderId = matchingOrder.id;
        matchingOrder.completed = true;
        matchingOrder.endTime = Date.now();
        this.completedOrders++;
        
        // 记录已使用的汉字
        if (!this.usedCharacters.includes(matchingOrder.character)) {
          this.usedCharacters.push(matchingOrder.character);
        }
        
        // 计算获得的积分
        const score = 500;
        this.currentScore += score;
        
        // 创建积分提示（右上角浮现）
        this.createScorePopup(100, 100, score);
        
        // 清空该煎药钵
        cauldron.herbs = [];
        cauldron.result = null;
        cauldron.status = 'idle';
        
        // 1秒后从订单列表中移除已完成的订单
        setTimeout(() => {
          // 从订单列表中移除已完成的订单
          const orderIndex = this.currentOrders.findIndex(order => order.id === orderId);
          if (orderIndex !== -1) {
            this.currentOrders.splice(orderIndex, 1);
            
            // 如果移除的是当前选中的订单，重置选中状态
            if (this.activeOrderIndex === orderIndex) {
              this.activeOrderIndex = null;
            } else if (this.activeOrderIndex > orderIndex) {
              // 如果移除的订单在当前选中订单之前，调整选中索引
              this.activeOrderIndex--;
            }
            
            // 生成下一个订单
            this.addNewOrder();
          }
        }, 1000);
      }
    },

    // 从煎药区移除草药
    removeHerbFromCauldron(cauldronIndex, herbIndex) {
      const cauldron = this.cauldrons[cauldronIndex];
      if (cauldron.status === 'idle') {
        cauldron.herbs.splice(herbIndex, 1);
        this.playSound('remove-herb');
      }
    },

    // 清空药锅
    clearCauldron(cauldronIndex) {
      const cauldron = this.cauldrons[cauldronIndex];
      if (cauldron.status !== 'cooking') {
        cauldron.herbs = [];
        cauldron.result = null;
        cauldron.status = 'idle';
        this.playSound('clear-cauldron');
      }
    },

    // 熬制药剂（煎药）
    cookMedicine(cauldronIndex) {
      this.playSound('cooking');
      const cauldron = this.cauldrons[cauldronIndex];
      if (cauldron.herbs.length === 0 || cauldron.status === 'cooking') return;
      
      cauldron.status = 'cooking';
      cauldron.progress = 0;
      
      // 播放烹饪音效
      this.playCookingSound();
      
      // 10秒倒计时煎药
      const cookingTime = 10000; // 10秒
      const startTime = Date.now();
      let pauseStartTime = null;
      let totalPauseDuration = 0;
      
      // 清除之前的计时器（如果有）
      if (cauldron.cookingTimer) {
        clearInterval(cauldron.cookingTimer);
      }
      
      // 设置进度更新计时器
      cauldron.cookingTimer = setInterval(() => {
        // 检查是否显示了教程或汉字知识界面
        if (this.showTutorial || this.showChineseKnowledge) {
          // 开始暂停
          if (!pauseStartTime) {
            pauseStartTime = Date.now();
            // 暂停烹饪音效
            if (this.cookingSound) {
              this.cookingSound.pause();
            }
          }
        } else {
          // 结束暂停
          if (pauseStartTime) {
            totalPauseDuration += Date.now() - pauseStartTime;
            pauseStartTime = null;
            // 恢复烹饪音效
            if (this.cookingSound && this.soundEnabled) {
              this.cookingSound.play().catch(e => {
                console.log('烹饪音效播放失败:', e);
              });
            }
          }
          
          // 计算实际烹饪时间（扣除暂停时间）
          const elapsedTime = Date.now() - startTime - totalPauseDuration;
          cauldron.progress = Math.min(100, (elapsedTime / cookingTime) * 100);
          
          if (elapsedTime >= cookingTime) {
            clearInterval(cauldron.cookingTimer);
            cauldron.cookingTimer = null;
            
            // 停止烹饪音效
            this.stopCookingSound();
            
            // 播放煎药完成提示音效
            this.playSound('cooking-complete');
            
            // 根据当前草药（偏旁部首）匹配完整汉字
            const herbChars = cauldron.herbs.map(herb => herb.char).join('');
            // 查找匹配的汉字
            const matchedChar = this.characters.find(char => {
              // 检查偏旁部首数量是否匹配
              if (char.radicals.length !== cauldron.herbs.length) {
                return false;
              }
              // 检查是否包含所有草药字符，并且数量匹配
              const radicalCount = {};
              char.radicals.forEach(rad => {
                radicalCount[rad] = (radicalCount[rad] || 0) + 1;
              });
              cauldron.herbs.forEach(herb => {
                const char = herb.char;
                if (radicalCount[char]) {
                  radicalCount[char]--;
                }
              });
              // 检查所有偏旁部首是否都被匹配
              return Object.values(radicalCount).every(count => count === 0);
            });
            // 如果找到匹配的汉字，使用它；否则使用草药组合
            cauldron.result = matchedChar ? matchedChar.char : herbChars;
            cauldron.herbs = [];
            cauldron.status = 'completed';
          }
        }
      }, 100);
    },



    // 开始拖拽煎好的汉字
    startDragCauldronResult(cauldronIndex, event) {
      const cauldron = this.cauldrons[cauldronIndex];
      if (!cauldron.result) return;
      this.draggedCharacter = cauldron.result;
      event.dataTransfer.effectAllowed = 'copy';
    },

    // 放置汉字到订单
    dropOrder(index) {
      if (!this.draggedCharacter) return;
      
      const order = this.currentOrders[index];
      if (order.completed) return;
      
      if (this.draggedCharacter === order.character) {
        const orderId = order.id;
        order.completed = true;
        order.endTime = Date.now();
        this.completedOrders++;
        this.draggedCharacter = null;
        
        // 计算获得的积分
        const score = 500;
        this.currentScore += score;
        
        // 创建积分提示（右上角浮现）
        this.createScorePopup(100, 100, score);
        
        // 1秒后从订单列表中移除已完成的订单
        setTimeout(() => {
          // 从订单列表中移除已完成的订单
          const orderIndex = this.currentOrders.findIndex(order => order.id === orderId);
          if (orderIndex !== -1) {
            this.currentOrders.splice(orderIndex, 1);
            
            // 如果移除的是当前选中的订单，重置选中状态
            if (this.activeOrderIndex === orderIndex) {
              this.activeOrderIndex = null;
            } else if (this.activeOrderIndex > orderIndex) {
              // 如果移除的订单在当前选中订单之前，调整选中索引
              this.activeOrderIndex--;
            }
            
            // 生成下一个订单
            this.addNewOrder();
          }
        }, 1000);
      }
    },







    // 结束当天
    endDay() {
      // 清除游戏计时器，避免重复调用
      if (this.gameTimer) {
        clearInterval(this.gameTimer);
        this.gameTimer = null;
      }
      
      this.gameState = 'ending';
      this.stopOrderGenerator();
      
      // 停止背景音乐
      this.stopBackgroundMusic();
      
      // 播放游戏结束音效
      this.playSound('game-over');
      
      // 计算统计数据
      this.calculateStats();
    },

    // 计算统计数据
    calculateStats() {
      this.accuracy = Math.round((this.completedOrders / this.currentOrders.length) * 100);
      // 计算平均完成时间
      const completedOrders = this.currentOrders.filter(order => order.completed);
      if (completedOrders.length > 0) {
        const totalTime = completedOrders.reduce((sum, order) => {
          return sum + (order.endTime - order.startTime) / 1000;
        }, 0);
        this.avgTime = Math.round(totalTime / completedOrders.length);
      }
      // 使用当前分数作为最终评分
      this.finalScore = this.currentScore;
      // 更新玩家等级
      this.updatePlayerLevel();
    },

    // 更新玩家等级
    updatePlayerLevel() {
      // 检查是否所有订单都按时完成
      const allOrdersCompleted = this.currentOrders.length > 0 && this.currentOrders.every(order => order.completed);
      if (allOrdersCompleted && this.accuracy === 100) {
        this.playerLevel = 'S级中药大师';
      } else if (this.finalScore >= 100) {
        this.playerLevel = '中药大师';
      } else if (this.finalScore >= 80) {
        this.playerLevel = '资深药剂师';
      } else if (this.finalScore >= 60) {
        this.playerLevel = '药剂师';
      } else {
        this.playerLevel = '学徒';
      }
    },

    // 筛选偏旁
    filterRadicals() {
      console.log('筛选偏旁，笔画数：', this.filterStroke);
    },

    // 下一天
    nextDay() {
      this.currentDay++;
      // 重置游戏状态
      this.resetGameState();
      // 重置积分
      this.currentScore = 0;
      // 重置剩余时间
      this.remainingTime = 210; // 3分30秒
      // 生成新订单
      this.generateInitialOrders();
      // 开始游戏
      this.gameState = 'playing';
      this.startTimer();
    },

    // 创建积分提示
    createScorePopup(x, y, score) {
      const popup = {
        x: x - 20,
        y: y - 50,
        score: score,
        delay: 0
      };
      this.scorePopups.push(popup);
      
      // 2秒后移除积分提示
      setTimeout(() => {
        const index = this.scorePopups.indexOf(popup);
        if (index !== -1) {
          this.scorePopups.splice(index, 1);
        }
      }, 2000);
    },

    // 重置游戏状态
    resetGameState() {
      // 清除游戏计时器
      if (this.gameTimer) {
        clearInterval(this.gameTimer);
        this.gameTimer = null;
      }
      this.currentOrders = [];
      this.activeOrderIndex = null;
      this.completedOrders = 0;
      this.showHerbBook = false;
      this.showMedicineCabinet = false;
      this.openCabinetItems = [];
      this.scorePopups = [];
      // 重置煎药钵状态
      this.cauldrons.forEach(cauldron => {
        cauldron.herbs = [];
        cauldron.status = 'idle';
        cauldron.result = null;
        cauldron.progress = 0;
        if (cauldron.cookingTimer) {
          clearInterval(cauldron.cookingTimer);
          cauldron.cookingTimer = null;
        }
      });
      // 重置难度系统
      this.currentDifficulty = 1;
      this.usedCharacters = [];
      // 重置汉字计数器
      this.characterCount = {};
      this.characterLastPosition = {};
      this.orderSequence = 0;
    },

    // 返回标题
    backToTitle() {
      this.playSound('click');
      this.gameState = 'title';
      this.resetGameState();
      this.currentDay = 1;
      this.playerLevel = '学徒';
      this.currentScore = 0;
      this.remainingTime = 210; // 3分30秒
      this.scorePopups = [];
      // 停止订单生成器
      this.stopOrderGenerator();
      // 停止背景音乐，播放标题音乐
      this.stopBackgroundMusic();
      this.playTitleMusic();
    },

    // 再来一局
    playAgain() {
      this.playSound('click');
      // 应用游戏设置
      this.remainingTime = this.gameSettings.gameTimeMinutes * 60 + this.gameSettings.gameTimeSeconds;
      this.maxOrders = Math.min(this.gameSettings.maxOrders, 9); // 确保订单上限不超过9
      
      // 重置游戏状态
      this.resetGameState();
      this.currentScore = 0;
      this.scorePopups = [];
      // 生成初始订单
      this.generateInitialOrders();
      // 开始游戏
      this.gameState = 'playing';
      this.startTimer();
      // 开始订单生成器
      this.startOrderGenerator();
      
      // 停止并重新播放背景音乐（从头开始）
      this.stopBackgroundMusic();
      this.playBackgroundMusic();
    }
  }
}
</script>

<style scoped>
/* 全局样式 */
.app {
  width: 100vw;
  height: 100vh;
  background-color: #f5f5dc;
  overflow: hidden;
  position: relative;
}
.time-info{
  padding-left:70px;
}
.score-info{
  padding-right:45px;
}



/* 积分提示样式 */
.score-popup {
  position: fixed;
  top: 20px;
  right: 20px;
  font-size: 48px;
  font-weight: bold;
  color: #8b4513;
  z-index: 1000;
  animation: scorePopup 2s ease-out forwards;
  pointer-events: none;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

@keyframes scorePopup {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.8);
  }
  20% {
    opacity: 1;
    transform: translateY(0) scale(1.5);
  }
  40% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-50px) scale(1);
  }
}

/* 标题界面样式 */
.title-screen {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: url('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20medicine%20shop%20interior%20with%20wooden%20cabinets%20and%20herbs%2C%20warm%20lighting%2C%20traditional%20chinese%20style&image_size=landscape_16_9');
  background-size: cover;
  background-position: center;
}

.title-container {
  text-align: center;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}

.title-container h1 {
  font-size: 48px;
  color: #8b4513;
  margin-bottom: 10px;
}

.title-container p {
  font-size: 20px;
  color: #666;
  margin-bottom: 30px;
}

.button-container {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: center;
}

.language-button-container {
  position: relative;
}

.language-button {
  background-color: #8b4513;
  color: white;
  font-size: 18px;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.language-button:hover {
  background-color: #a0522d;
}

.language-dropdown {
  position: absolute;
  top: 100%;
  left:-20px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 5px;
  z-index: 1000;
  min-width: 120px;
}

.language-option {
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.language-option:hover {
  background-color: #f5f5f5;
}

.start-button {
  background-color: #8b4513;
  color: white;
  font-size: 18px;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.start-button:hover {
  background-color: #a0522d;
}

.tutorial-button, .library-button {
  background-color: #d2b48c;
  color: #8b4513;
  font-size: 18px;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin: 5px;
}

.tutorial-button:hover, .library-button:hover {
  background-color: #deb887;
}

/* 游戏规则界面样式 */
.tutorial-screen {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}

.tutorial-container {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.tutorial-container h2 {
  color: #8b4513;
  margin-bottom: 20px;
}

.tutorial-content p {
  margin-bottom: 10px;
  line-height: 1.5;
}

/* 汉字知识界面样式 */
.chinese-knowledge-screen {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}

.chinese-knowledge-container {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
}

.chinese-knowledge-container h2 {
  color: #8b4513;
  margin-bottom: 20px;
}

.chinese-knowledge-content {
  margin-bottom: 20px;
}

.chinese-knowledge-content h3 {
  color: #8b4513;
  margin-top: 20px;
  margin-bottom: 10px;
}

.chinese-knowledge-content p {
  margin-bottom: 10px;
  line-height: 1.5;
}

.chinese-knowledge-content ul {
  margin-left: 20px;
  margin-bottom: 15px;
}

.chinese-knowledge-content li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.chinese-knowledge-content strong {
  color: #8b4513;
}

.back-button {
  background-color: #8b4513;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
}

/* 偏旁资料库界面样式 */
.library-screen {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 0;
  left: 0;
}

.library-container {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
}

.library-container h2 {
  color: #8b4513;
  margin-bottom: 20px;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-button {
  background-color: #8b4513;
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.radical-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.radical-item {
  border: 1px solid #d2b48c;
  border-radius: 5px;
  padding: 15px;
  text-align: center;
}

.radical-char {
  font-size: 36px;
  margin-bottom: 10px;
}

.radical-info h3 {
  font-size: 16px;
  margin-bottom: 5px;
}

.radical-info p {
  font-size: 14px;
  margin-bottom: 3px;
  color: #666;
}

/* 游戏主界面样式 */
.game-screen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  background-color: #8b4513;
  color: white;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.shop-container {
  flex: 1;
  display: flex;
  padding: 15px;
  gap: 15px;
  margin-bottom: 190px; /* 为底部熬药区留出空间，适应高度变化 */
  overflow: hidden;
}

/* 订单区样式 */
.order-section {
  width: 240px;
  height:100%;
  background-color: white;
  border-radius: 10px;
  padding: 12px 15px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
}
.order-section h2 {
  color: #8b4513;
  text-align: center;
  padding-bottom: 10px;
  font-size: 16px;
}
.order-list {
  flex: 1;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-start;
  align-content: flex-start;
}


.order-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-start;
}

.order-item {
  border: 1px solid #d2b48c;
  border-radius: 5px;
  padding: 8px;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
  width: calc(33.333% - 8px);
  box-sizing: border-box;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.order-item.active {
  border-color: #8b4513;
  background-color: #f5f5dc;
}

.order-item.completed {
  opacity: 0.7;
}

.order-item.danger {
  border-color: #f44336;
  background-color: rgba(244, 67, 54, 0.05);
}

.order-pinyin {
  font-size: 11px;
  color: #666;
  margin-bottom: 1px;
  text-align: center;
}

.order-character {
  font-size: 18px;
  margin: 1px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-status {
  font-size: 11px;
  color: #666;
  margin-top: 3px;
}

.order-time {
  font-size: 10px;
  color: #8b4513;
  margin-top: 4px;
  font-weight: bold;
}

/* 订单进度条 */
.order-progress {
  width: 100%;
  height: 3px;
  background-color: #f0f0f0;
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}

.order-progress-bar {
  height: 100%;
  background-color: #4CAF50;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.order-progress-bar.warning {
  background-color: #ff9800;
}

.order-progress-bar.danger {
  background-color: #f44336;
}

/* 订单进入动画 */
@keyframes orderSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.order-item {
  animation: orderSlideIn 0.5s ease-out;
}

.order-item {
  cursor: pointer;
  transition: all 0.2s ease;
}

.order-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* 主操作区样式 */
.main-section {
  flex: 1;
  background-color: white;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 草药手册样式 */
.herb-book {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #d2b48c;
  border-radius: 8px;
  padding: 15px;
  background-color: #fafafa;
  overflow: hidden;
}

.book-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.herb-book h3 {
  color: #8b4513;
  margin-bottom: 15px;
  text-align: center;
  border-bottom: 1px solid #d2b48c;
  padding-bottom: 10px;
}

.pinyin-search {
  margin-bottom: 20px;
}

.search-button {
  background-color: #8b4513;
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.character-results {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.character-option {
  border: 1px solid #d2b48c;
  border-radius: 5px;
  padding: 15px;
  text-align: center;
}

.character-symbol {
  font-size: 36px;
  margin-bottom: 5px;
}

.character-pinyin {
  font-size: 16px;
  color: #666;
  margin-bottom: 10px;
}

.character-recipe {
  font-size: 14px;
  margin-bottom: 10px;
}

.character-strokes {
  font-size: 14px;
  color: #8b4513;
  display: flex;
  justify-content: center;
  gap: 10px;
}

/* 药柜样式 */
.medicine-cabinet {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #d2b48c;
  border-radius: 8px;
  padding: 15px;
  background-color: #fafafa;
  overflow-y: auto;
}

.cabinet-content {
  display: flex;
  gap: 20px;
  flex: 1;
  overflow: hidden;
}



.medicine-cabinet h3 {
  color: #8b4513;
  margin-bottom: 15px;
  text-align: center;
  border-bottom: 1px solid #d2b48c;
  padding-bottom: 10px;
}

.cabinet-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.cabinet-tab {
  background-color: #d2b48c;
  color: #8b4513;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.cabinet-tab.active {
  background-color: #8b4513;
  color: white;
}

.stroke-selector {
  margin-bottom: 20px;
}

.open-button {
  background-color: #8b4513;
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.cabinet-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 8px;
}

.herb-item {
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border: 1px solid #d2b48c;
  border-radius: 5px;
  text-align: center;
  transition: all 0.2s ease;
}

.herb-item:hover {
  background-color: #f5f5dc;
  transform: scale(1.05);
}

.herb-item:active {
  transform: scale(0.95);
}

/* 笔画数按钮样式 */
.stroke-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 15px 0;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 5px;
  flex-shrink: 0;
}

.stroke-button {
  background-color: #d2b48c;
  color: #8b4513;
  border: 1px solid #8b4513;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.stroke-button:hover:not(:disabled) {
  background-color: #deb887;
  transform: translateY(-1px);
}

.stroke-button.active {
  background-color: #8b4513;
  color: white;
  font-weight: bold;
}

.stroke-button.active:hover {
  background-color: #a0522d;
}

.stroke-button:disabled {
  background-color: #e0e0e0;
  color: #999;
  border: 1px solid #ccc;
  cursor: not-allowed;
}

/* 偏旁柜和部首柜样式 */
.radical-cabinet,
.component-cabinet {
  background-color: #f9f9f9;
  border: 1px solid #d2b48c;
  border-radius: 5px;
  padding: 15px;
  flex: 1;
  overflow-y: auto;
}

.radical-cabinet h4,
.component-cabinet h4 {
  color: #8b4513;
  margin-top: 0;
  margin-bottom: 0;
}

.cabinet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #d2b48c;
  padding-bottom: 10px;
}

.stroke-input {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stroke-input-box {
  width: 50px;
  padding: 5px;
  border: 1px solid #d2b48c;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  color: #8b4513;
}

.stroke-input-box:disabled {
  background-color: #e0e0e0;
  color: #999;
  cursor: not-allowed;
}

.stroke-unit {
  font-size: 14px;
  color: #8b4513;
  white-space: nowrap;
}

.cabinet-hint {
  text-align: center;
  color: #666;
  font-style: italic;
  margin: 20px 0;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 3px;
}

.herb-item.active {
  background-color: #8b4513;
  color: white;
  border-color: #8b4513;
}

.herb-item.active:hover {
  background-color: #a0522d;
}

/* 熬药区样式（固定在底部） */
.cooking-area {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  min-height: 180px;
  background-color: white;
  border-top: 2px solid #8b4513;
  padding: 10px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.cooking-header {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.cooking-header h3 {
  color: #8b4513;
  margin: 0;
  text-align: center;
}

.cauldrons-container {
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  gap: 15px;
  flex-wrap: wrap;
}

.cauldron-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 180px;
  max-width: 220px;
}

.cauldron {
  width: 150px;
  height: 150px;
  border: 2px solid #8b4513;
  border-radius: 50% 50% 20% 20%;
  background-color: #f5f5dc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.cauldron:hover {
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(139, 69, 19, 0.3);
}

.cauldron.idle {
  border-color: #8b4513;
  background-color: #f5f5dc;
}

.cauldron.cooking {
  border-color: #ff9800;
  background-color: rgba(255, 152, 0, 0.1);
}

.cauldron.completed {
  border-color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
  cursor: pointer;
}

.cauldron.completed:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.5);
  border-color: #45a049;
}

.cauldron.completed:active {
  transform: scale(0.95);
  transition: all 0.1s ease;
}

.cauldron-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 3px;
  margin-top: 5px;
  max-width: 120px;
  max-height: 100px;
  overflow-y: auto;
  /* 隐藏滚动条但保持内容可滚动 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.cauldron-content::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.cooking-herb {
  font-size: 18px;
  padding: 3px 8px;
  border: 1px solid #d2b48c;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: white;
}

.cooking-herb:hover {
  background-color: #deb887;
  transform: scale(1.05);
}

.result-character {
  font-size: 28px;
  color: #8b4513;
  margin-top: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.result-character:hover {
  transform: scale(1.1);
  text-shadow: 2px 2px 4px rgba(139, 69, 19, 0.3);
}

.result-character.animating {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.cooking-animation {
  position: relative;
  height: 80px;
  width: 100%;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(139, 69, 19, 0.3);
  border-radius: 50%;
  border-top-color: #8b4513;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.cooking-progress {
  width: 80%;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 5px;
}

.cooking-progress-bar {
  height: 100%;
  background-color: #4CAF50;
  border-radius: 3px;
  transition: width 0.1s linear;
}

.cooking-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 5px;
}

.clear-button {
  background-color: #f44336;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.clear-button:hover:not(:disabled) {
  background-color: #d32f2f;
  transform: translateY(-2px);
}

.cook-button {
  background-color: #4CAF50;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.cook-button:hover:not(:disabled) {
  background-color: #388E3C;
  transform: translateY(-2px);
}

.clear-button:disabled, .cook-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 调整shop-container的margin-bottom以适应新的cooking-area高度 */
.shop-container {
  margin-bottom: 250px;
}

/* 控制区样式 */
.control-section {
  width: 160px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-button {
  background-color: #d2b48c;
  color: #8b4513;
  font-size: 16px;
  padding: 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  text-align: center;
}

.control-button:hover {
  background-color: #deb887;
}

.submit-button {
  background-color: #8b4513;
  color: white;
  font-size: 16px;
  padding: 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  text-align: center;
  margin-top: auto;
}

.submit-button:hover {
  background-color: #a0522d;
}

/* 游戏结束界面样式 */
.ending-screen {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 0;
  left: 0;
}

.ending-container {
  background-color: white;
  padding: 40px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}

.ending-container h2 {
  color: #8b4513;
  margin-bottom: 30px;
}

.ending-stats {
  margin-bottom: 30px;
}

.ending-stats p {
  font-size: 18px;
  margin-bottom: 10px;
}

.next-day-button, .title-button {
  background-color: #8b4513;
  color: white;
  font-size: 18px;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin: 5px;
}

.next-day-button:hover, .title-button:hover {
  background-color: #a0522d;
}

.ending-buttons {
  margin-top: 20px;
  display: flex;
  gap: 15px;
  justify-content: center;
}

.title-button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #8b4513;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

/* 设置按钮样式 */
.settings-button {
  background-color: #8b4513;
  color: white;
  font-size: 18px;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.settings-button:hover {
  background-color: #a0522d;
}

/* 设置页面样式 */
.settings-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.settings-container {
  background-color: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 500px;
  width: 90%;
}

.settings-content {
  margin: 20px 0;
  text-align: left;
}

.setting-item {
  margin: 15px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.time-input {
  display: flex;
  align-items: center;
}

.settings-buttons {
  margin: 20px 0;
}

.reset-button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #ff9800;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 10px;
}

.reset-button:hover {
  background-color: #f57c00;
}

.save-button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-left: 10px;
}

.save-button:hover {
  background-color: #388e3c;
}

.settings-message {
  margin-top: 15px;
  padding: 10px;
  background-color: #4caf50;
  color: white;
  border-radius: 5px;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>