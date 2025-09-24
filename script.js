document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements
    const pairSelector = document.getElementById('pairSelector');
    const languageSelect = document.getElementById('languageSelect'); // NEW: Language selector

    // Store references to all pair sections
    const pairSections = {
        'USDJPY': document.getElementById('usdJpySection'),
        'EURJPY': document.getElementById('eurJpySection'),
        'GOLD': document.getElementById('goldSection')
    };

    const dotStates = [
        'grey', 'green', 'red', 'yellow', 'yellow-up', 'yellow-down', 'white'
    ]; // Corresponds to index 0-6
    // Labels for prediction table (these will be translated)
    const dotStateLabels = {
        'ms': ['Neutral', 'Buy', 'Sell', 'Neutral', 'Buy Potential', 'Sell Potential', 'Mixed/Neutral'],
        'en': ['Neutral', 'Buy', 'Sell', 'Neutral', 'Buy Potential', 'Sell Potential', 'Mixed/Neutral'],
        'zh': ['中性', '买入', '卖出', '中性', '潜在买入', '潜在卖出', '混合/中性']
    };

    // Mapping from dotState index to heatmap color class index (0-9)
    // This defines the risk level associated with each dot state
    const dotStateToHeatmapColorMap = {
        0: 4, // grey (Neutral) -> color-4 (yellow)
        1: 0, // green (Buy) -> color-0 (original green)
        2: 9, // red (Sell) -> color-9 (original red)
        3: 4, // yellow (Neutral) -> color-4 (yellow)
        4: 2, // yellow-up (Buy Potential) -> color-2 (original green-ish)
        5: 7, // yellow-down (Sell Potential) -> color-7 (original orange-ish)
        6: 5  // white (Mixed/Neutral) -> color-5 (original orange-ish)
    };

    // Global object to store current PTS values for each pair
    const currentPTSValues = {
        'USDJPY': 0,
        'EURJPY': 0,
        'GOLD': 0
    };

    // Define indicators and timeframes for consistent iteration
    const indicators = ['EMA', 'BB', 'RSI', 'MACD'];
    // Labels for heatmap and prediction table (these will be translated)
    const indicatorLabels = {
        'ms': ['Trend', 'BB', 'RSI', 'MACD'],
        'en': ['Trend', 'BB', 'RSI', 'MACD'],
        'zh': ['趋势', '布林带', 'RSI', 'MACD']
    };
    const timeframes = ['Day1', 'M15', 'H1', 'H4'];
    const timeframeLabels = {
        'ms': ['D1', 'M15', 'H1', 'H4'],
        'en': ['D1', 'M15', 'H1', 'H4'],
        'zh': ['日线', '15分钟', '1小时', '4小时']
    };
    
    const dataGridRows = 4; // 4 indicators
    const dataGridCols = 4; // 4 timeframes
    const heatmapCellSpan = 2; // Each dot mapping state covers a 2x2 block of heatmap cells


    // Firebase related global variables (now managed directly in script.js)
    let firebaseApp = null;
    let db = null;
    let auth = null;
    let userId = null;
    const appId = window.appId; // Still comes from index.html module script

    // Flag to ensure initial data load from Firestore happens only once after auth
    let isAuthReadyAndInitialLoadDone = false;
    const loadingIndicator = document.getElementById('loadingIndicator');

    // Cloud feature toggle elements
    const enableCloudToggle = document.getElementById('enableCloudFeatures');
    const saveDataCloudBtn = document.getElementById('saveDataCloudBtn');
    const loadDataCloudBtn = document.getElementById('loadDataCloudBtn');

    // History and local save/load elements (Moved to the top)
    const simulationHistoryList = document.getElementById('simulationHistoryList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const copyHistoryBtn = document.getElementById('copyHistoryBtn'); 
    const downloadHistoryBtn = document.getElementById('downloadHistoryBtn');
    const saveDataLocalBtn = document.getElementById('saveDataLocalBtn');
    const loadDataLocalBtn = document.getElementById('loadDataLocalBtn');
    const loadFileInput = document.getElementById('loadFileInput');
    const downloadHistoryHeatmapBtn = document.getElementById('downloadHistoryHeatmapBtn');


    // Help Modal Elements
    const helpInfoBtn = document.getElementById('helpInfoBtn');
    const helpModal = document.getElementById('helpModal');
    const closeButton = document.querySelector('.close-button');
    const modalBody = document.getElementById('modalBody');

    // Current language variable
    let currentLanguage = localStorage.getItem('selectedLanguage') || 'ms'; // Default to Malay

    // --- Translation Data ---
    const translations = {
        'ms': {
            // General
            'appTitle': 'Enoviax Manual Simulator (EMS)',
            'mainTitle': 'Enoviax Manual Simulator (EMS)',
            'softwareArch': 'Seni bina perisian: Zulkarnain Haron.',
            'codingAssist': 'Bantuan pengekodan: AI.',
            'proudMessage': '"Saya Sangat Bangga dengan anda" Ainul Mardiah".',
            'currentDateTimeDisplay': 'Waktu Semasa:',
            'userIdDisplayLoading': 'User ID: Memuatkan...',
            'userIdDisplayCloudDisabled': 'User ID: Ciri Awan Dilumpuhkan',
            'userIdDisplayAnonymous': 'User ID (Anonymous):',
            'userIdDisplayLoginFailed': 'User ID: Gagal Log Masuk',
            'userIdDisplayFirebaseInitError': 'User ID: Ralat Inisialisasi Firebase',
            'loadingIndicator': 'Memuatkan data...',
            'languageLabel': 'Pilih Bahasa:',
            'pairSelectorLabel': 'Pilih Pair:',

            // Pair Sections (USDJPY, EURJPY, GOLD)
            'usdjpyMappingTitle': 'USD/JPY - DOT154 Mapping',
            'eurjpyMappingTitle': 'EUR/JPY - DOT154 Mapping',
            'goldMappingTitle': 'XAU/USD - DOT154 Mapping',

            // Table Headers
            'indicatorHeader': 'Indikator',
            'day1Header': 'Day 1',
            'm15Header': 'M15',
            'h1Header': 'H1',
            'h4Header': 'H4',

            // Indicator Labels (shared across pairs)
            'emaLabel': 'EMA9 vs WMA50',
            'bbLabel': 'BB 20:3',
            'rsiLabel': 'RSI14',
            'macdLabel': 'MACD (12,26,9)',

            // PTS Section
            'ptsScoreTitle': 'PTS Score (Psychological & Candle Pressure)',
            'ptsInputLabel': 'Masukkan PTS Score:',
            'ptsOption0': '0 (Tiada)',
            'ptsOption0_5': '+0.5 (Strong Pinbar @ BB Lower)',
            'ptsOption1_0': '+1.0 (Bullish Rejection on Major Support)',
            'ptsOptionNeg0_5': '-0.5 (Mild Bearish)',
            'ptsOptionNeg1_0': '-1.0 (Bearish Engulfing on Resistance)',
            'buyPriceLabel': 'Harga Beli:',
            'buyPricePlaceholder': 'Masukkan harga beli',
            'sellPriceLabel': 'Harga Jual:',
            'sellPricePlaceholder': 'Masukkan harga jual',

            // Main Buttons
            'simulateBtnUSDJPY': 'Simulasikan Prediksi USD/JPY',
            'generatePredictionButtonUSDJPY': 'Jana Ramalan Dot Mapping & Harga USD/JPY',
            'simulateBtnEURJPY': 'Simulasikan Prediksi EUR/JPY',
            'generatePredictionButtonEURJPY': 'Jana Ramalan Dot Mapping & Harga EUR/JPY',
            'simulateBtnGOLD': 'Simulasikan Prediksi XAU/USD',
            'generatePredictionButtonGOLD': 'Jana Ramalan Dot Mapping & Harga XAU/USD',

            // Results Section
            'resultsTitle': 'Hasil Simulasi',
            'htsScoreText': 'HTS Score:',
            'ptsScoreText': 'PTS Score:',
            'deltaXText': 'Delta-X Total:',
            'grailConfidenceText': 'Grail Confidence:',
            'confidenceLevelText': 'Tahap Keyakinan:',
            'predictionResultTitle': 'Keputusan Prediksi:',
            'm15StatusText': 'Status M15:',
            'h1StatusText': 'Status H1:',
            'h4StatusText': 'Status H4:',
            'riskWarning': '▲ PERINGATAN RISIKO ({pair}): HTS Score di bawah 6.0. Elakkan trade.',
            'riskWarningDefault': 'Tiada Data', // For when no warning is active
            'riskHeatmapTitle': 'RISK HEATMAP',
            'heatmapD1Header': 'D1',
            'heatmapM15Header': 'M15',
            'heatmapH1Header': 'H1',
            'heatmapH4Header': 'H4',
            'heatmapTrendLabel': 'Trend',
            'heatmapBBLabel': 'BB',
            'heatmapRSILabel': 'RSI',
            'heatmapMACDLabel': 'MACD',

            // Prediction Dot Mapping Table
            'predictionDotMappingTitle': 'Ramalan Dot Mapping',
            'predIndicatorHeader': 'Indikator',
            'predDay1Header': 'Day 1',
            'predM15Header': 'M15',
            'predH1Header': 'H1',
            'predH4Header': 'H4',

            // Simulation History Section
            'simulationHistoryTitle': 'Sejarah Simulasi',
            'clearHistoryBtn': 'Kosongkan Sejarah',
            'copyHistoryBtn': 'Salin Sejarah (Papan Klip)',
            'downloadHistoryBtn': 'Muat Turun Sejarah (Fail Teks)',
            'saveDataLocalBtn': 'Simpan Data (Tempatan)',
            'loadDataLocalBtn': 'Muat Data (Tempatan)',
            'loadFileInputTitle': 'Muat Data dari Fail JSON (Tempatan)',
            'enableCloudFeaturesLabel': 'Aktifkan Data Awan:',
            'saveDataCloudBtn': 'Simpan Data (Awan)',
            'loadDataCloudBtn': 'Muat Data (Awan)',
            'helpInfoBtn': 'Bantuan / Info',
            'downloadHistoryHeatmapBtn': 'Muat Turun Heatmap Sejarah (HTML)',
            'noHistoryYet': 'Tiada sejarah simulasi lagi.',
            'historyItemPrefix': 'Simulasi',
            'historyHTS': 'HTS:',
            'historyPTS': 'PTS:',
            'historyDeltaX': 'Delta-X:',
            'historyConfidence': 'Confidence:',
            'historyLevel': 'Level:',
            'historyResult': 'Result:',
            'historyBuyPrice': 'Harga Beli:',
            'historySellPrice': 'Harga Jual:',
            'historyNAText': 'N/A',
            'historyDotMappingTitle': 'Ramalan Dot Mapping',

            // Prediction Results (dynamic strings)
            'highConfidence': 'High Confidence',
            'buyEntry': 'BUY ENTRY',
            'sellEntry': 'SELL ENTRY',
            'mediumConfidence': 'Medium Confidence',
            'potentialBuyEntry': 'Potential Buy Entry',
            'potentialSellEntry': 'Potential Sell Entry',
            'lowConfidence': 'Low Confidence',
            'sidewatchWaitingEntry': 'Sidewatch / Waiting Entry',
            'noClearDirection': 'No Clear Direction',
            'bullishBias': 'Bullish Bias',
            'bearishBias': 'Bearish Bias',
            'mixedNeutralBias': 'Mixed/Neutral Bias',
            'noData': 'Tiada Data',
            'noPrediction': 'Tiada Prediksi',

            // Alert Messages
            'alertLocalSaveSuccess': 'Data simulator telah disimpan sebagai fail JSON (Tempatan).',
            'alertLocalLoadError': 'Ralat memuatkan fail. Pastikan ia adalah fail JSON yang sah.',
            'alertLocalLoadSuccess': 'Data simulator telah berjaya dimuatkan dari fail JSON (Tempatan)!',
            'alertCloudDisabledSave': 'Ciri Data Awan dilumpuhkan. Sila aktifkan untuk menyimpan ke awan.',
            'alertFirebaseNotReady': 'Firestore atau User ID belum sedia. Sila cuba lagi sebentar atau pastikan konfigurasi Firebase betul.',
            'alertCloudSaveError': 'Gagal menyimpan data ke awan. Sila semak konsol untuk butiran.',
            'alertCloudSaveSuccess': 'Data simulator telah berjaya disimpan ke awan!',
            'alertNoCloudData': 'Tiada data simulator ditemui di awan untuk pengguna ini.',
            'alertCloudLoadError': 'Gagal memuatkan data dari awan. Sila semak konsol untuk butiran.',
            'alertNoHistoryDownload': 'Tiada sejarah simulasi untuk dimuat turun.',
            'alertTextDownloadSuccess': 'Sejarah simulasi telah dimuat turun sebagai fail teks!',
            'alertClipboardBlocked': "Fungsi 'Salin Sejarah (Papan Klip)' tidak berfungsi dalam persekitaran ini disebabkan oleh sekatan pelayar. Sila gunakan butang 'Muat Turun Sejarah (Fail Teks)' sebagai gantinya.",
            'confirmClearHistory': 'Adakah anda pasti ingin mengosongkan semua sejarah simulasi?',
            'alertHistoryCleared': 'Sejarah simulasi telah dikosongkan.',
            'alertNoHeatmapDownload': 'Tiada sejarah heatmap untuk dimuat turun.',
            'alertHeatmapDownloadSuccess': 'Sejarah heatmap telah dimuat turun sebagai fail HTML! Anda boleh membuka dan mencetaknya.',
            'alertPopupBlocked': 'Pelayar menyekat pop-up. Sila benarkan pop-up untuk mencetak.',

            // Help Modal Content
            'helpModalTitle': 'Bantuan & Maklumat Enoviax EMS',
            'helpIntroTitle': 'Pengenalan kepada Enoviax Manual Simulator (EMS)',
            'helpIntroPara': 'Enoviax Manual Simulator (EMS) direka untuk membantu anda membuat keputusan perdagangan yang lebih termaklum dengan mensimulasikan ramalan berdasarkan indikator teknikal dan faktor psikologi.',
            'helpIndicatorsTitle': 'Indikator DOT154 Mapping',
            'helpEMA': 'EMA9 vs WMA50 (Trend):',
            'helpEMADesc': 'Mengukur arah trend pasaran. EMA (Exponential Moving Average) dan WMA (Weighted Moving Average) digunakan untuk mengenal pasti sama ada pasaran berada dalam trend menaik, menurun, atau mendatar.',
            'helpEMAGreen': 'Hijau (Buy): Trend menaik yang kuat.',
            'helpEMARed': 'Merah (Sell): Trend menurun yang kuat.',
            'helpEMAYellow': 'Kuning (Neutral): Pasaran mendatar atau tiada trend jelas.',
            'helpEMALightGreen': 'Hijau Muda (Buy Potential): Potensi trend menaik.',
            'helpEMAOrange': 'Jingga (Sell Potential): Potensi trend menurun.',
            'helpEMAWhite': 'Putih (Mixed): Isyarat bercampur atau tidak jelas.',
            'helpEMAGrey': 'Kelabu (Neutral): Default atau tiada data.',
            'helpBB': 'BB 20:3 (Bollinger Bands):',
            'helpBBDesc': 'Mengukur volatiliti pasaran dan mengenal pasti keadaan overbought/oversold. Lebar band menunjukkan volatiliti, manakala harga yang menyentuh band atas/bawah boleh menandakan pembalikan.',
            'helpRSI': 'RSI14 (Relative Strength Index):',
            'helpRSIDesc': 'Indikator momentum yang mengukur kelajuan dan perubahan pergerakan harga. Digunakan untuk mengenal pasti keadaan overbought (biasanya >70) atau oversold (biasanya <30).',
            'helpMACD': 'MACD (Moving Average Convergence Divergence) (12,26,9):',
            'helpMACDDesc': 'Indikator pengikut trend momentum yang menunjukkan hubungan antara dua moving average harga. Digunakan untuk isyarat beli/jual dan pengesahan trend.',
            'helpScoreSystemTitle': 'Sistem Skor',
            'helpHTS': 'HTS Score (Historical Technical Score):',
            'helpHTSDesc1': 'Jumlah skor daripada indikator EMA, BB, RSI, dan MACD pada timeframe M15, H1, dan H4. Setiap indikator menyumbang +1 untuk \'Buy\'/\'Buy Potential\' dan -1 untuk \'Sell\'/\'Sell Potential\'. Day 1 tidak menyumbang kepada HTS Score.',
            'helpHTSDesc2': 'Julat: -12 hingga +12.',
            'helpPTS': 'PTS Score (Psychological & Candle Pressure Score):',
            'helpPTSDesc1': 'Skor manual yang anda masukkan berdasarkan analisis tekanan psikologi pasaran dan corak candlestick (contoh: pinbar, engulfing). Ini membolehkan anda menggabungkan analisis diskresionari anda.',
            'helpPTSDesc2': 'Julat: -1.0 hingga +1.0.',
            'helpDeltaX': 'Delta-X Total:',
            'helpDeltaXDesc1': 'HTS Score + PTS Score. Ini adalah skor keseluruhan yang digunakan untuk menentukan keyakinan dan keputusan prediksi.',
            'helpDeltaXDesc2': 'Julat: -13 hingga +13.',
            'helpGrailConfidence': 'Grail Confidence:',
            'helpGrailConfidenceDesc1': 'Peratusan keyakinan berdasarkan Delta-X Total. Semakin tinggi Delta-X (positif atau negatif), semakin tinggi keyakinan.',
            'helpGrailConfidenceList90': 'Delta-X >= 9 atau <= -9: 90% Keyakinan',
            'helpGrailConfidenceList70': 'Delta-X >= 7 atau <= -7: 70% Keyakinan',
            'helpGrailConfidenceList50': 'Delta-X >= 5 atau <= -5: 50% Keyakinan',
            'helpGrailConfidenceList30': 'Lain-lain: 30% Keyakinan',
            'helpConfidenceResult': 'Tahap Keyakinan & Keputusan Prediksi:',
            'helpConfidenceResultDesc1': 'Ditentukan berdasarkan Delta-X Total dan HTS Score:',
            'helpConfidenceResultListHighBuy': 'Delta-X >= 6 DAN HTS >= 6: High Confidence, BUY ENTRY',
            'helpConfidenceResultListHighSell': 'Delta-X <= -6 DAN HTS <= -6: High Confidence, SELL ENTRY',
            'helpConfidenceResultListMediumBuy': 'Delta-X >= 3: Medium Confidence, Potential Buy Entry',
            'helpConfidenceResultListMediumSell': 'Delta-X <= -3: Medium Confidence, Potential Sell Entry',
            'helpConfidenceResultListLow': 'Lain-lain: Low Confidence / No Clear Direction, Sidewatch / Waiting Entry',
            'helpHeatmapTitle': 'Risk Heatmap',
            'helpHeatmapDesc1': 'Heatmap memvisualisasikan tahap risiko atau peluang berdasarkan status setiap indikator pada setiap timeframe. Warna-warna mewakili:',
            'helpHeatmapGreen': 'Hijau Terang (0-3): Risiko Sangat Rendah / Peluang Tinggi (Buy)',
            'helpHeatmapYellow': 'Kuning (4): Risiko Neutral / Tiada Arah Jelas',
            'helpHeatmapRed': 'Merah (5-9): Risiko Tinggi / Peluang Buruk (Sell)',
            'helpHeatmapDesc2': 'Skala warna: 0 (Hijau Penuh) hingga 9 (Merah Penuh), dengan Kuning di tengah (4).',

            // Print HTML content
            'printHtmlTitle': 'Sejarah Heatmap Enoviax Manual Simulator (EMS)',
            'printHtmlSimulationPrefix': 'Simulasi',
            'printHtmlHeatmapNotDisplayed': 'Heatmap tidak dapat dipaparkan.'
        },
        'en': {
            // General
            'appTitle': 'Enoviax Manual Simulator (EMS)',
            'mainTitle': 'Enoviax Manual Simulator (EMS)',
            'softwareArch': 'Software architecture: Zulkarnain Haron.',
            'codingAssist': 'Coding assistance: AIs.',
            'proudMessage': '"I am Very Proud of you" Ainul Mardiah".',
            'currentDateTimeDisplay': 'Current Time:',
            'userIdDisplayLoading': 'User ID: Loading...',
            'userIdDisplayCloudDisabled': 'User ID: Cloud Features Disabled',
            'userIdDisplayAnonymous': 'User ID (Anonymous):',
            'userIdDisplayLoginFailed': 'User ID: Login Failed',
            'userIdDisplayFirebaseInitError': 'User ID: Firebase Initialization Error',
            'loadingIndicator': 'Loading data...',
            'languageLabel': 'Select Language:',
            'pairSelectorLabel': 'Select Pair:',

            // Pair Sections (USDJPY, EURJPY, GOLD)
            'usdjpyMappingTitle': 'USD/JPY - DOT154 Mapping',
            'eurjpyMappingTitle': 'EUR/JPY - DOT154 Mapping',
            'goldMappingTitle': 'XAU/USD - DOT154 Mapping',

            // Table Headers
            'indicatorHeader': 'Indicator',
            'day1Header': 'Day 1',
            'm15Header': 'M15',
            'h1Header': 'H1',
            'h4Header': 'H4',

            // Indicator Labels (shared across pairs)
            'emaLabel': 'EMA9 vs WMA50',
            'bbLabel': 'BB 20:3',
            'rsiLabel': 'RSI14',
            'macdLabel': 'MACD (12,26,9)',

            // PTS Section
            'ptsScoreTitle': 'PTS Score (Psychological & Candle Pressure)',
            'ptsInputLabel': 'Enter PTS Score:',
            'ptsOption0': '0 (None)',
            'ptsOption0_5': '+0.5 (Strong Pinbar @ BB Lower)',
            'ptsOption1_0': '+1.0 (Bullish Rejection on Major Support)',
            'ptsOptionNeg0_5': '-0.5 (Mild Bearish)',
            'ptsOptionNeg1_0': '-1.0 (Bearish Engulfing on Resistance)',
            'buyPriceLabel': 'Buy Price:',
            'buyPricePlaceholder': 'Enter buy price',
            'sellPriceLabel': 'Sell Price:',
            'sellPricePlaceholder': 'Enter sell price',

            // Main Buttons
            'simulateBtnUSDJPY': 'Simulate Prediction USD/JPY',
            'generatePredictionButtonUSDJPY': 'Generate Dot Mapping & Price Prediction USD/JPY',
            'simulateBtnEURJPY': 'Simulate Prediction EUR/JPY',
            'generatePredictionButtonEURJPY': 'Generate Dot Mapping & Price Prediction EUR/JPY',
            'simulateBtnGOLD': 'Simulate Prediction XAU/USD',
            'generatePredictionButtonGOLD': 'Generate Dot Mapping & Price Prediction XAU/USD',

            // Results Section
            'resultsTitle': 'Simulation Results',
            'htsScoreText': 'HTS Score:',
            'ptsScoreText': 'PTS Score:',
            'deltaXText': 'Delta-X Total:',
            'grailConfidenceText': 'Grail Confidence:',
            'confidenceLevelText': 'Confidence Level:',
            'predictionResultTitle': 'Prediction Result:',
            'm15StatusText': 'M15 Status:',
            'h1StatusText': 'H1 Status:',
            'h4StatusText': 'H4 Status:',
            'riskWarning': '▲ RISK WARNING ({pair}): HTS Score below 6.0. Avoid trading.',
            'riskWarningDefault': 'No Data',
            'riskHeatmapTitle': 'RISK HEATMAP',
            'heatmapD1Header': 'D1',
            'heatmapM15Header': 'M15',
            'heatmapH1Header': 'H1',
            'heatmapH4Header': 'H4',
            'heatmapTrendLabel': 'Trend',
            'heatmapBBLabel': 'BB',
            'heatmapRSILabel': 'RSI',
            'heatmapMACDLabel': 'MACD',

            // Prediction Dot Mapping Table
            'predictionDotMappingTitle': 'Dot Mapping Prediction',
            'predIndicatorHeader': 'Indicator',
            'predDay1Header': 'Day 1',
            'predM15Header': 'M15',
            'predH1Header': 'H1',
            'predH4Header': 'H4',

            // Simulation History Section
            'simulationHistoryTitle': 'Simulation History',
            'clearHistoryBtn': 'Clear History',
            'copyHistoryBtn': 'Copy History (Clipboard)',
            'downloadHistoryBtn': 'Download History (Text File)',
            'saveDataLocalBtn': 'Save Data (Local)',
            'loadDataLocalBtn': 'Load Data (Local)',
            'loadFileInputTitle': 'Load Data from JSON File (Local)',
            'enableCloudFeaturesLabel': 'Enable Cloud Features:',
            'saveDataCloudBtn': 'Save Data (Cloud)',
            'loadDataCloudBtn': 'Load Data (Cloud)',
            'helpInfoBtn': 'Help / Info',
            'downloadHistoryHeatmapBtn': 'Download History Heatmap (HTML)',
            'noHistoryYet': 'No simulation history yet.',
            'historyItemPrefix': 'Simulation',
            'historyHTS': 'HTS:',
            'historyPTS': 'PTS:',
            'historyDeltaX': 'Delta-X:',
            'historyConfidence': 'Confidence:',
            'historyLevel': 'Level:',
            'historyResult': 'Result:',
            'historyBuyPrice': 'Buy Price:',
            'historySellPrice': 'Sell Price:',
            'historyNAText': 'N/A',
            'historyDotMappingTitle': 'Dot Mapping Prediction',

            // Prediction Results (dynamic strings)
            'highConfidence': 'High Confidence',
            'buyEntry': 'BUY ENTRY',
            'sellEntry': 'SELL ENTRY',
            'mediumConfidence': 'Medium Confidence',
            'potentialBuyEntry': 'Potential Buy Entry',
            'potentialSellEntry': 'Potential Sell Entry',
            'lowConfidence': 'Low Confidence',
            'sidewatchWaitingEntry': 'Sidewatch / Waiting Entry',
            'noClearDirection': 'No Clear Direction',
            'bullishBias': 'Bullish Bias',
            'bearishBias': 'Bearish Bias',
            'mixedNeutralBias': 'Mixed/Neutral Bias',
            'noData': 'No Data',
            'noPrediction': 'No Prediction',

            // Alert Messages
            'alertLocalSaveSuccess': 'Simulator data saved as JSON file (Local).',
            'alertLocalLoadError': 'Error loading file. Please ensure it is a valid JSON file.',
            'alertLocalLoadSuccess': 'Simulator data successfully loaded from JSON file (Local)!',
            'alertCloudDisabledSave': 'Cloud Features are disabled. Please enable to save to cloud.',
            'alertFirebaseNotReady': 'Firestore or User ID not ready. Please try again shortly or ensure Firebase config is correct.',
            'alertCloudSaveError': 'Failed to save data to cloud. Please check console for details.',
            'alertCloudSaveSuccess': 'Simulator data successfully saved to cloud!',
            'alertNoCloudData': 'No simulator data found in cloud for this user.',
            'alertCloudLoadError': 'Failed to load data from cloud. Please check console for details.',
            'alertNoHistoryDownload': 'No simulation history to download.',
            'alertTextDownloadSuccess': 'Simulation history downloaded as a text file!',
            'alertClipboardBlocked': "'Copy History (Clipboard)' function is blocked in this environment due to browser restrictions. Please use 'Download History (Text File)' instead.",
            'confirmClearHistory': 'Are you sure you want to clear all simulation history?',
            'alertHistoryCleared': 'Simulation history cleared.',
            'alertNoHeatmapDownload': 'No heatmap history to download.',
            'alertHeatmapDownloadSuccess': 'Heatmap history downloaded as an HTML file! You can open and print it.',
            'alertPopupBlocked': 'Browser blocked pop-up. Please allow pop-ups to print.',

            // Help Modal Content
            'helpModalTitle': 'Enoviax EMS Help & Information',
            'helpIntroTitle': 'Introduction to Enoviax Manual Simulator (EMS)',
            'helpIntroPara': 'Enoviax Manual Simulator (EMS) is designed to help you make more informed trading decisions by simulating predictions based on technical indicators and psychological factors.',
            'helpIndicatorsTitle': 'DOT154 Mapping Indicators',
            'helpEMA': 'EMA9 vs WMA50 (Trend):',
            'helpEMADesc': 'Measures the market trend direction. EMA (Exponential Moving Average) and WMA (Weighted Moving Average) are used to identify whether the market is in an uptrend, downtrend, or sideways.',
            'helpEMAGreen': 'Green (Buy): Strong uptrend.',
            'helpEMARed': 'Red (Sell): Strong downtrend.',
            'helpEMAYellow': 'Yellow (Neutral): Sideways market or no clear trend.',
            'helpEMALightGreen': 'Light Green (Buy Potential): Potential uptrend.',
            'helpEMAOrange': 'Orange (Sell Potential): Potential downtrend.',
            'helpEMAWhite': 'White (Mixed): Mixed or unclear signals.',
            'helpEMAGrey': 'Grey (Neutral): Default or no data.',
            'helpBB': 'BB 20:3 (Bollinger Bands):',
            'helpBBDesc': 'Measures market volatility and identifies overbought/oversold conditions. Band width indicates volatility, while prices touching the upper/lower bands can signal reversals.',
            'helpRSI': 'RSI14 (Relative Strength Index):',
            'helpRSIDesc': 'A momentum indicator that measures the speed and change of price movements. Used to identify overbought (typically >70) or oversold (typically <30) conditions.',
            'helpMACD': 'MACD (Moving Average Convergence Divergence) (12,26,9):',
            'helpMACDDesc': 'A trend-following momentum indicator that shows the relationship between two moving averages of a price. Used for buy/sell signals and trend confirmation.',
            'helpScoreSystemTitle': 'Scoring System',
            'helpHTS': 'HTS Score (Historical Technical Score):',
            'helpHTSDesc1': 'The total score from EMA, BB, RSI, and MACD indicators on M15, H1, and H4 timeframes. Each indicator contributes +1 for \'Buy\'/\'Buy Potential\' and -1 for \'Sell\'/\'Sell Potential\'. Day 1 does not contribute to the HTS Score.',
            'helpHTSDesc2': 'Range: -12 to +12.',
            'helpPTS': 'PTS Score (Psychological & Candle Pressure Score):',
            'helpPTSDesc1': 'A manual score you enter based on your analysis of market psychological pressure and candlestick patterns (e.g., pinbar, engulfing). This allows you to incorporate your discretionary analysis.',
            'helpPTSDesc2': 'Range: -1.0 to +1.0.',
            'helpDeltaX': 'Delta-X Total:',
            'helpDeltaXDesc1': 'HTS Score + PTS Score. This is the overall score used to determine confidence and prediction outcome.',
            'helpDeltaXDesc2': 'Range: -13 to +13.',
            'helpGrailConfidence': 'Grail Confidence:',
            'helpGrailConfidenceDesc1': 'Percentage confidence based on Delta-X Total. The higher the Delta-X (positive or negative), the higher the confidence.',
            'helpGrailConfidenceList90': 'Delta-X >= 9 or <= -9: 90% Confidence',
            'helpGrailConfidenceList70': 'Delta-X >= 7 or <= -7: 70% Confidence',
            'helpGrailConfidenceList50': 'Delta-X >= 5 or <= -5: 50% Confidence',
            'helpGrailConfidenceList30': 'Others: 30% Confidence',
            'helpConfidenceResult': 'Confidence Level & Prediction Result:',
            'helpConfidenceResultDesc1': 'Determined based on Delta-X Total and HTS Score:',
            'helpConfidenceResultListHighBuy': 'Delta-X >= 6 AND HTS >= 6: High Confidence, BUY ENTRY',
            'helpConfidenceResultListHighSell': 'Delta-X <= -6 AND HTS <= -6: High Confidence, SELL ENTRY',
            'helpConfidenceResultListMediumBuy': 'Delta-X >= 3: Medium Confidence, Potential Buy Entry',
            'helpConfidenceResultListMediumSell': 'Delta-X <= -3: Medium Confidence, Potential Sell Entry',
            'helpConfidenceResultListLow': 'Others: Low Confidence / No Clear Direction, Sidewatch / Waiting Entry',
            'helpHeatmapTitle': 'Risk Heatmap',
            'helpHeatmapDesc1': 'The heatmap visualizes the risk or opportunity level based on the status of each indicator across timeframes. Colors represent:',
            'helpHeatmapGreen': 'Bright Green (0-3): Very Low Risk / High Opportunity (Buy)',
            'helpHeatmapYellow': 'Yellow (4): Neutral Risk / No Clear Direction',
            'helpHeatmapRed': 'Red (5-9): High Risk / Poor Opportunity (Sell)',
            'helpHeatmapDesc2': 'Color scale: 0 (Full Green) to 9 (Full Red), with Yellow in the middle (4).',

            // Print HTML content
            'printHtmlTitle': 'Enoviax Manual Simulator (EMS) Heatmap History',
            'printHtmlSimulationPrefix': 'Simulation',
            'printHtmlHeatmapNotDisplayed': 'Heatmap could not be displayed.'
        },
        'zh': {
            // General
            'appTitle': 'Enoviaax 手动模拟器 (EMS)',
            'mainTitle': 'Enoviaax 手动模拟器 (EMS)',
            'softwareArch': '软件架构: Zulkarnain Haron.',
            'codingAssist': '编码协助: AI.',
            'proudMessage': '"我为你感到非常骄傲" Ainul Mardiah".',
            'currentDateTimeDisplay': '当前时间:',
            'userIdDisplayLoading': '用户ID: 加载中...',
            'userIdDisplayCloudDisabled': '用户ID: 云功能已禁用',
            'userIdDisplayAnonymous': '用户ID (匿名):',
            'userIdDisplayLoginFailed': '用户ID: 登录失败',
            'userIdDisplayFirebaseInitError': '用户ID: Firebase 初始化错误',
            'loadingIndicator': '加载数据...',
            'languageLabel': '选择语言:',
            'pairSelectorLabel': '选择交易对:',

            // Pair Sections (USDJPY, EURJPY, GOLD)
            'usdjpyMappingTitle': '美元/日元 - DOT154 映射',
            'eurjpyMappingTitle': '欧元/日元 - DOT154 映射',
            'goldMappingTitle': '黄金/美元 - DOT154 映射',

            // Table Headers
            'indicatorHeader': '指标',
            'day1Header': '日线',
            'm15Header': '15分钟',
            'h1Header': '1小时',
            'h4Header': '4小时',

            // Indicator Labels (shared across pairs)
            'emaLabel': 'EMA9 vs WMA50',
            'bbLabel': 'BB 20:3',
            'rsiLabel': 'RSI14',
            'macdLabel': 'MACD (12,26,9)',

            // PTS Section
            'ptsScoreTitle': 'PTS 分数 (心理与蜡烛压力)',
            'ptsInputLabel': '输入 PTS 分数:',
            'ptsOption0': '0 (无)',
            'ptsOption0_5': '+0.5 (强劲吞噬线 @ 布林带下轨)',
            'ptsOption1_0': '+1.0 (主要支撑位看涨拒绝)',
            'ptsOptionNeg0_5': '-0.5 (轻微看跌)',
            'ptsOptionNeg1_0': '-1.0 (阻力位看跌吞噬)',
            'buyPriceLabel': '买入价格:',
            'buyPricePlaceholder': '输入买入价格',
            'sellPriceLabel': '卖出价格:',
            'sellPricePlaceholder': '输入卖出价格',

            // Main Buttons
            'simulateBtnUSDJPY': '模拟美元/日元预测',
            'generatePredictionButtonUSDJPY': '生成美元/日元点映射和价格预测',
            'simulateBtnEURJPY': '模拟欧元/日元预测',
            'generatePredictionButtonEURJPY': '生成欧元/日元点映射和价格预测',
            'simulateBtnGOLD': '模拟黄金/美元预测',
            'generatePredictionButtonGOLD': '生成黄金/美元点映射和价格预测',

            // Results Section
            'resultsTitle': '模拟结果',
            'htsScoreText': 'HTS 分数:',
            'ptsScoreText': 'PTS 分数:',
            'deltaXText': 'Delta-X 总计:',
            'grailConfidenceText': '圣杯置信度:',
            'confidenceLevelText': '置信水平:',
            'predictionResultTitle': '预测结果:',
            'm15StatusText': '15分钟状态:',
            'h1StatusText': '1小时状态:',
            'h4StatusText': '4小时状态:',
            'riskWarning': '▲ 风险警告 ({pair}): HTS 分数低于 6.0。避免交易。',
            'riskWarningDefault': '无数据',
            'riskHeatmapTitle': '风险热图',
            'heatmapD1Header': '日线',
            'heatmapM15Header': '15分钟',
            'heatmapH1Header': '1小时',
            'heatmapH4Header': '4小时',
            'heatmapTrendLabel': '趋势',
            'heatmapBBLabel': '布林带',
            'heatmapRSILabel': 'RSI',
            'heatmapMACDLabel': 'MACD',

            // Prediction Dot Mapping Table
            'predictionDotMappingTitle': '点映射预测',
            'predIndicatorHeader': '指标',
            'predDay1Header': '日线',
            'predM15Header': '15分钟',
            'predH1Header': '1小时',
            'predH4Header': '4小时',

            // Simulation History Section
            'simulationHistoryTitle': '模拟历史',
            'clearHistoryBtn': '清空历史',
            'copyHistoryBtn': '复制历史 (剪贴板)',
            'downloadHistoryBtn': '下载历史 (文本文件)',
            'saveDataLocalBtn': '保存数据 (本地)',
            'loadDataLocalBtn': '加载数据 (本地)',
            'loadFileInputTitle': '从 JSON 文件加载数据 (本地)',
            'enableCloudFeaturesLabel': '启用云功能:',
            'saveDataCloudBtn': '保存数据 (云端)',
            'loadDataCloudBtn': '加载数据 (云端)',
            'helpInfoBtn': '帮助 / 信息',
            'downloadHistoryHeatmapBtn': '下载历史热图 (HTML)',
            'noHistoryYet': '暂无模拟历史。',
            'historyItemPrefix': '模拟',
            'historyHTS': 'HTS:',
            'historyPTS': 'PTS:',
            'historyDeltaX': 'Delta-X:',
            'historyConfidence': '置信度:',
            'historyLevel': '水平:',
            'historyResult': '结果:',
            'historyBuyPrice': '买入价格:',
            'historySellPrice': '卖出价格:',
            'historyNAText': 'N/A',
            'historyDotMappingTitle': '点映射预测',

            // Prediction Results (dynamic strings)
            'highConfidence': '高置信度',
            'buyEntry': '买入入场',
            'sellEntry': '卖出入场',
            'mediumConfidence': '中置信度',
            'potentialBuyEntry': '潜在买入入场',
            'potentialSellEntry': '潜在卖出入场',
            'lowConfidence': '低置信度',
            'sidewatchWaitingEntry': '观望 / 等待入场',
            'noClearDirection': '无明确方向',
            'bullishBias': '看涨倾向',
            'bearishBias': '看跌倾向',
            'mixedNeutralBias': '混合/中性倾向',
            'noData': '无数据',
            'noPrediction': '无预测',

            // Alert Messages
            'alertLocalSaveSuccess': '模拟器数据已保存为本地 JSON 文件。',
            'alertLocalLoadError': '加载文件出错。请确保它是有效的 JSON 文件。',
            'alertLocalLoadSuccess': '模拟器数据已成功从本地 JSON 文件加载！',
            'alertCloudDisabledSave': '云功能已禁用。请启用以保存到云端。',
            'alertFirebaseNotReady': 'Firestore 或用户 ID 尚未准备好。请稍后再试或确保 Firebase 配置正确。',
            'alertCloudSaveError': '保存数据到云端失败。请查看控制台了解详情。',
            'alertCloudSaveSuccess': '模拟器数据已成功保存到云端！',
            'alertNoCloudData': '此用户在云端未找到模拟器数据。',
            'alertCloudLoadError': '从云端加载数据失败。请查看控制台了解详情。',
            'alertNoHistoryDownload': '没有可下载的模拟历史。',
            'alertTextDownloadSuccess': '模拟历史已下载为文本文件！',
            'alertClipboardBlocked': "'复制历史 (剪贴板)' 功能在此环境中因浏览器限制而被阻止。请改用 '下载历史 (文本文件)'。",
            'confirmClearHistory': '您确定要清空所有模拟历史吗？',
            'alertHistoryCleared': '模拟历史已清空。',
            'alertNoHeatmapDownload': '没有可下载的热图历史。',
            'alertHeatmapDownloadSuccess': '热图历史已下载为 HTML 文件！您可以打开并打印它。',
            'alertPopupBlocked': '浏览器阻止了弹出窗口。请允许弹出窗口进行打印。',

            // Help Modal Content
            'helpModalTitle': 'Enoviaax EMS 帮助与信息',
            'helpIntroTitle': 'Enoviaax 手动模拟器 (EMS) 简介',
            'helpIntroPara': 'Enoviaax 手动模拟器 (EMS) 旨在通过模拟基于技术指标和心理因素的预测，帮助您做出更明智的交易决策。',
            'helpIndicatorsTitle': 'DOT154 映射指标',
            'helpEMA': 'EMA9 vs WMA50 (趋势):',
            'helpEMADesc': '衡量市场趋势方向。EMA (指数移动平均线) 和 WMA (加权移动平均线) 用于识别市场是处于上升趋势、下降趋势还是横盘。',
            'helpEMAGreen': '绿色 (买入): 强劲上升趋势。',
            'helpEMARed': '红色 (卖出): 强劲下降趋势。',
            'helpEMAYellow': '黄色 (中性): 横盘市场或无明确趋势。',
            'helpEMALightGreen': '浅绿色 (潜在买入): 潜在上升趋势。',
            'helpEMAOrange': '橙色 (潜在卖出): 潜在下降趋势。',
            'helpEMAWhite': '白色 (混合): 混合或不明确信号。',
            'helpEMAGrey': '灰色 (中性): 默认或无数据。',
            'helpBB': 'BB 20:3 (布林带):',
            'helpBBDesc': '衡量市场波动性并识别超买/超卖情况。布林带宽度表示波动性，而价格触及上/下轨可能预示反转。',
            'helpRSI': 'RSI14 (相对强弱指数):',
            'helpRSIDesc': '一种衡量价格变动速度和变化的动量指标。用于识别超买 (通常 >70) 或超卖 (通常 <30) 情况。',
            'helpMACD': 'MACD (移动平均线收敛扩散) (12,26,9):',
            'helpMACDDesc': '一种趋势跟踪动量指标，显示价格两条移动平均线之间的关系。用于买入/卖出信号和趋势确认。',
            'helpScoreSystemTitle': '评分系统',
            'helpHTS': 'HTS 分数 (历史技术分数):',
            'helpHTSDesc1': '来自 M15、H1 和 H4 时间框架的 EMA、BB、RSI 和 MACD 指标的总分。每个指标对“买入”/“潜在买入”贡献 +1，对“卖出”/“潜在卖出”贡献 -1。日线不计入 HTS 分数。',
            'helpHTSDesc2': '范围: -12 到 +12。',
            'helpPTS': 'PTS 分数 (心理与蜡烛压力分数):',
            'helpPTSDesc1': '您根据市场心理压力和蜡烛图模式（例如：pinbar，吞噬线）分析手动输入的分数。这允许您纳入您的自由裁量分析。',
            'helpPTSDesc2': '范围: -1.0 到 +1.0。',
            'helpDeltaX': 'Delta-X 总计:',
            'helpDeltaXDesc1': 'HTS 分数 + PTS 分数。这是用于确定置信度和预测结果的总分。',
            'helpDeltaXDesc2': '范围: -13 到 +13。',
            'helpGrailConfidence': '圣杯置信度:',
            'helpGrailConfidenceDesc1': '基于 Delta-X 总计的置信度百分比。Delta-X 越高（正或负），置信度越高。',
            'helpGrailConfidenceList90': 'Delta-X >= 9 或 <= -9: 90% 置信度',
            'helpGrailConfidenceList70': 'Delta-X >= 7 或 <= -7: 70% 置信度',
            'helpGrailConfidenceList50': 'Delta-X >= 5 或 <= -5: 50% 置信度',
            'helpGrailConfidenceList30': '其他: 30% 置信度',
            'helpConfidenceResult': '置信水平与预测结果:',
            'helpConfidenceResultDesc1': '根据 Delta-X 总计和 HTS 分数确定:',
            'helpConfidenceResultListHighBuy': 'Delta-X >= 6 且 HTS >= 6: 高置信度，买入入场',
            'helpConfidenceResultListHighSell': 'Delta-X <= -6 且 HTS <= -6: 高置信度，卖出入场',
            'helpConfidenceResultListMediumBuy': 'Delta-X >= 3: 中置信度，潜在买入入场',
            'helpConfidenceResultListMediumSell': 'Delta-X <= -3: 中置信度，潜在卖出入场',
            'helpConfidenceResultListLow': '其他: 低置信度 / 无明确方向，观望 / 等待入场',
            'helpHeatmapTitle': '风险热图',
            'helpHeatmapDesc1': '热图可视化了每个指标在不同时间框架下的风险或机会水平。颜色代表：',
            'helpHeatmapGreen': '亮绿色 (0-3): 风险极低 / 机会高 (买入)',
            'helpHeatmapYellow': '黄色 (4): 中性风险 / 无明确方向',
            'helpHeatmapRed': '红色 (5-9): 风险高 / 机会差 (卖出)',
            'helpHeatmapDesc2': '颜色刻度: 0 (全绿) 到 9 (全红)，黄色在中间 (4)。',

            // Print HTML content
            'printHtmlTitle': 'Enoviaax 手动模拟器 (EMS) 热图历史',
            'printHtmlSimulationPrefix': '模拟',
            'printHtmlHeatmapNotDisplayed': '热图无法显示。'
        }
    };

    // --- Function to update all text elements based on selected language ---
    function updateLanguage(lang) {
        currentLanguage = lang;
        localStorage.setItem('selectedLanguage', lang); // Save preference

        const currentTranslations = translations[lang];

        // Update main title
        document.getElementById('appTitle').textContent = currentTranslations['appTitle'];
        document.getElementById('mainTitle').textContent = currentTranslations['mainTitle'];

        // Update credits
        document.getElementById('softwareArch').textContent = currentTranslations['softwareArch'];
        document.getElementById('codingAssist').textContent = currentTranslations['codingAssist'];
        document.getElementById('proudMessage').textContent = currentTranslations['proudMessage'];

        // Update general labels
        document.getElementById('languageLabel').textContent = currentTranslations['languageLabel'];
        document.getElementById('pairSelectorLabel').textContent = currentTranslations['pairSelectorLabel'];
        document.getElementById('loadingIndicator').textContent = currentTranslations['loadingIndicator'];

        // Update User ID display based on its current state (loading, disabled, etc.)
        const userIdDisplay = document.getElementById('userIdDisplay');
        if (userIdDisplay.textContent.includes('Memuatkan')) { // Check current Malay text
            userIdDisplay.textContent = currentTranslations['userIdDisplayLoading'];
        } else if (userIdDisplay.textContent.includes('Ciri Awan Dilumpuhkan')) { // Check current Malay text
            userIdDisplay.textContent = currentTranslations['userIdDisplayCloudDisabled'];
        } else if (userIdDisplay.textContent.includes('Anonymous')) { // Check current English text
            userIdDisplay.textContent = `${currentTranslations['userIdDisplayAnonymous']} ${userId}`;
        } else if (userIdDisplay.textContent.includes('Gagal Log Masuk')) { // Check current Malay text
            userIdDisplay.textContent = currentTranslations['userIdDisplayLoginFailed'];
        } else if (userIdDisplay.textContent.includes('Ralat Inisialisasi Firebase')) { // Check current Malay text
            userIdDisplay.textContent = currentTranslations['userIdDisplayFirebaseInitError'];
        } else if (userId) { // If user ID is already displayed
             userIdDisplay.textContent = `User ID: ${userId}`; // Keep actual ID, just update prefix if needed
        }


        // Update Pair Sections and their static texts
        ['USDJPY', 'EURJPY', 'GOLD'].forEach(pair => {
            const pairLower = pair.toLowerCase();
            document.getElementById(`${pairLower}MappingTitle`).textContent = currentTranslations[`${pairLower}MappingTitle`];
            
            // Table Headers
            document.getElementById(`indicatorHeader${pair}`).textContent = currentTranslations['indicatorHeader'];
            document.getElementById(`day1Header${pair}`).textContent = currentTranslations['day1Header'];
            document.getElementById(`m15Header${pair}`).textContent = currentTranslations['m15Header'];
            document.getElementById(`h1Header${pair}`).textContent = currentTranslations['h1Header'];
            document.getElementById(`h4Header${pair}`).textContent = currentTranslations['h4Header'];

            // Indicator Labels
            document.getElementById(`emaLabel${pair}`).textContent = currentTranslations['emaLabel'];
            document.getElementById(`bbLabel${pair}`).textContent = currentTranslations['bbLabel'];
            document.getElementById(`rsiLabel${pair}`).textContent = currentTranslations['rsiLabel'];
            document.getElementById(`macdLabel${pair}`).textContent = currentTranslations['macdLabel'];

            // Update indicator button titles
            document.querySelectorAll(`.indicator-button[data-pair="${pair}"]`).forEach(button => {
                const indicator = button.dataset.indicator;
                const timeframe = button.dataset.timeframe;
                let indicatorText = '';
                switch(indicator) {
                    case 'EMA': indicatorText = currentTranslations['emaLabel']; break;
                    case 'BB': indicatorText = currentTranslations['bbLabel']; break;
                    case 'RSI': indicatorText = currentTranslations['rsiLabel']; break;
                    case 'MACD': indicatorText = currentTranslations['macdLabel']; break;
                }
                button.title = `${pair} ${indicatorText} - ${timeframe}`;
            });

            // PTS Section
            document.getElementById(`ptsScoreTitle${pair}`).textContent = currentTranslations['ptsScoreTitle'];
            document.getElementById(`ptsInputLabel${pair}`).textContent = currentTranslations['ptsInputLabel'];
            document.getElementById(`ptsOption0${pair}`).textContent = currentTranslations['ptsOption0'];
            document.getElementById(`ptsOption0_5${pair}`).textContent = currentTranslations['ptsOption0_5'];
            document.getElementById(`ptsOption1_0${pair}`).textContent = currentTranslations['ptsOption1_0'];
            document.getElementById(`ptsOptionNeg0_5${pair}`).textContent = currentTranslations['ptsOptionNeg0_5'];
            document.getElementById(`ptsOptionNeg1_0${pair}`).textContent = currentTranslations['ptsOptionNeg1_0'];
            document.getElementById(`buyPriceLabel${pair}`).textContent = currentTranslations['buyPriceLabel'];
            document.getElementById(`buyPriceInput${pair}`).placeholder = currentTranslations['buyPricePlaceholder'];
            document.getElementById(`sellPriceLabel${pair}`).textContent = currentTranslations['sellPriceLabel'];
            document.getElementById(`sellPriceInput${pair}`).placeholder = currentTranslations['sellPricePlaceholder'];

            // Main Buttons
            document.getElementById(`simulateBtn${pair}`).textContent = currentTranslations[`simulateBtn${pair}`];
            document.getElementById(`generatePredictionButton${pair}`).textContent = currentTranslations[`generatePredictionButton${pair}`];

            // Results Section
            document.getElementById(`resultsTitle${pair}`).textContent = `${currentTranslations['resultsTitle']} ${pair}`;
            document.getElementById(`htsScoreText${pair}`).textContent = currentTranslations['htsScoreText'];
            document.getElementById(`ptsScoreText${pair}`).textContent = currentTranslations['ptsScoreText'];
            document.getElementById(`deltaXText${pair}`).textContent = currentTranslations['deltaXText'];
            document.getElementById(`grailConfidenceText${pair}`).textContent = currentTranslations['grailConfidenceText'];
            document.getElementById(`confidenceLevelText${pair}`).textContent = currentTranslations['confidenceLevelText'];
            document.getElementById(`predictionResultTitle${pair}`).textContent = currentTranslations['predictionResultTitle'];
            document.getElementById(`m15StatusText${pair}`).textContent = currentTranslations['m15StatusText'];
            document.getElementById(`h1StatusText${pair}`).textContent = currentTranslations['h1StatusText'];
            document.getElementById(`h4StatusText${pair}`).textContent = currentTranslations['h4StatusText'];
            
            // Risk Warning (update text if visible)
            const riskWarningDiv = document.getElementById(`riskWarning${pair}`);
            if (riskWarningDiv && riskWarningDiv.style.display !== 'none') {
                riskWarningDiv.textContent = currentTranslations['riskWarning'].replace('{pair}', pair);
            }

            // Heatmap Headers
            document.getElementById(`riskHeatmapTitle${pair}`).textContent = currentTranslations['riskHeatmapTitle'];
            document.getElementById(`heatmapD1Header${pair}`).textContent = currentTranslations['heatmapD1Header'];
            document.getElementById(`heatmapM15Header${pair}`).textContent = currentTranslations['heatmapM15Header'];
            document.getElementById(`heatmapH1Header${pair}`).textContent = currentTranslations['heatmapH1Header'];
            document.getElementById(`heatmapH4Header${pair}`).textContent = currentTranslations['heatmapH4Header'];
            document.getElementById(`heatmapTrendLabel${pair}`).textContent = currentTranslations['heatmapTrendLabel'];
            document.getElementById(`heatmapBBLabel${pair}`).textContent = currentTranslations['heatmapBBLabel'];
            document.getElementById(`heatmapRSILabel${pair}`).textContent = currentTranslations['heatmapRSILabel'];
            document.getElementById(`heatmapMACDLabel${pair}`).textContent = currentTranslations['heatmapMACDLabel'];

            // Prediction Dot Mapping Table
            document.getElementById(`predictionDotMappingTitle${pair}`).textContent = `${currentTranslations['predictionDotMappingTitle']} ${pair}`;
            document.getElementById(`predIndicatorHeader${pair}`).textContent = currentTranslations['predIndicatorHeader'];
            document.getElementById(`predDay1Header${pair}`).textContent = currentTranslations['predDay1Header'];
            document.getElementById(`predM15Header${pair}`).textContent = currentTranslations['predM15Header'];
            document.getElementById(`predH1Header${pair}`).textContent = currentTranslations['predH1Header'];
            document.getElementById(`predH4Header${pair}`).textContent = currentTranslations['predH4Header'];
        });

        // Simulation History Section
        document.getElementById('simulationHistoryTitle').textContent = currentTranslations['simulationHistoryTitle'];
        document.getElementById('clearHistoryBtn').textContent = currentTranslations['clearHistoryBtn'];
        document.getElementById('copyHistoryBtn').textContent = currentTranslations['copyHistoryBtn'];
        document.getElementById('downloadHistoryBtn').textContent = currentTranslations['downloadHistoryBtn'];
        document.getElementById('saveDataLocalBtn').textContent = currentTranslations['saveDataLocalBtn'];
        document.getElementById('loadDataLocalBtn').textContent = currentTranslations['loadDataLocalBtn'];
        document.getElementById('loadFileInput').title = currentTranslations['loadFileInputTitle']; // Update title attribute
        document.getElementById('enableCloudFeaturesLabel').textContent = currentTranslations['enableCloudFeaturesLabel'];
        document.getElementById('saveDataCloudBtn').textContent = currentTranslations['saveDataCloudBtn'];
        document.getElementById('loadDataCloudBtn').textContent = currentTranslations['loadDataCloudBtn'];
        document.getElementById('helpInfoBtn').textContent = currentTranslations['helpInfoBtn'];
        document.getElementById('downloadHistoryHeatmapBtn').textContent = currentTranslations['downloadHistoryHeatmapBtn'];

        // Re-render dynamic content that uses translated strings
        renderSimulationHistory(); // This will re-render history with new language
        populateHelpModalContent(); // This will re-populate help modal with new language
        
        // Ensure current pair's simulation results are updated with new language
        const currentPair = pairSelector.value;
        performSimulation(currentPair); 
        generateDotMappingTable(currentPair);
    }

    // --- Firebase Initialization Function ---
    async function initializeFirebase() {
        if (firebaseApp) {
            console.log("Firebase sudah dimulakan. Melangkau inisialisasi.");
            return; // Already initialized
        }

        let firebaseConfig = {};
        try {
            firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
        } catch (e) {
            console.error("Ralat menghurai __firebase_config:", e);
            firebaseConfig = {};
        }

        if (Object.keys(firebaseConfig).length > 0) {
            try {
                firebaseApp = window.firebase.initializeApp(firebaseConfig);
                auth = window.firebase.getAuth(firebaseApp);
                db = window.firebase.getFirestore(firebaseApp);

                window.firebase.onAuthStateChanged(auth, async (user) => {
                    if (user) {
                        userId = user.uid;
                        document.getElementById('userIdDisplay').textContent = `${translations[currentLanguage]['userIdDisplayAnonymous']} ${userId}`; // Update with translation
                        console.log("Firebase dimulakan dan pengguna disahkan:", userId);
                        if (!isAuthReadyAndInitialLoadDone) {
                            loadDataFromCloud();
                            isAuthReadyAndInitialLoadDone = true;
                        }
                    } else {
                        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                            try {
                                const userCredential = await window.firebase.signInWithCustomToken(auth, __initial_auth_token);
                                userId = userCredential.user.uid;
                                document.getElementById('userIdDisplay').textContent = `${translations[currentLanguage]['userIdDisplayAnonymous']} ${userId}`; // Update with translation
                                console.log("Log masuk dengan token tersuai:", userId);
                                if (!isAuthReadyAndInitialLoadDone) {
                                    loadDataFromCloud();
                                    isAuthReadyAndInitialLoadDone = true;
                                }
                            } catch (error) {
                                console.error("Ralat log masuk dengan token tersuai:", error);
                                try {
                                    const userCredential = await window.firebase.signInAnonymously(auth);
                                    userId = userCredential.user.uid;
                                    document.getElementById('userIdDisplay').textContent = `${translations[currentLanguage]['userIdDisplayAnonymous']} ${userId}`; // Update with translation
                                    console.log("Log masuk tanpa nama:", userId);
                                    if (!isAuthReadyAndInitialLoadDone) {
                                        loadDataFromCloud();
                                        isAuthReadyAndInitialLoadDone = true;
                                    }
                                } catch (anonError) {
                                    console.error("Ralat log masuk tanpa nama:", anonError);
                                    document.getElementById('userIdDisplay').textContent = translations[currentLanguage]['userIdDisplayLoginFailed']; // Update with translation
                                }
                            }
                        } else {
                            try {
                                const userCredential = await window.firebase.signInAnonymously(auth);
                                userId = userCredential.user.uid;
                                document.getElementById('userIdDisplay').textContent = `${translations[currentLanguage]['userIdDisplayAnonymous']} ${userId}`; // Update with translation
                                console.log("Log masuk tanpa nama (tiada token):", userId);
                                if (!isAuthReadyAndInitialLoadDone) {
                                    loadDataFromCloud();
                                    isAuthReadyAndInitialLoadDone = true;
                                }
                            } catch (anonError) {
                                console.error("Ralat log masuk tanpa nama:", anonError);
                                document.getElementById('userIdDisplay').textContent = translations[currentLanguage]['userIdDisplayLoginFailed']; // Update with translation
                            }
                        }
                    }
                });
            } catch (initError) {
                console.error("Ralat memulakan Firebase:", initError);
                document.getElementById('userIdDisplay').textContent = translations[currentLanguage]['userIdDisplayFirebaseInitError']; // Update with translation
                firebaseApp = null;
                db = null;
                auth = null;
                userId = null;
            }
        } else {
            console.warn("Konfigurasi Firebase tiada atau kosong. Ciri Awan tidak akan tersedia.");
            document.getElementById('userIdDisplay').textContent = translations[currentLanguage]['userIdDisplayFirebaseInitError']; // Re-use this for no config
            firebaseApp = null;
            db = null;
            auth = null;
            userId = null;
        }
    }

    // Function to update cloud button visibility and state
    function updateCloudButtonState() {
        const isCloudEnabled = enableCloudToggle.checked;
        localStorage.setItem('cloudFeaturesEnabled', isCloudEnabled);

        if (saveDataCloudBtn) saveDataCloudBtn.disabled = !isCloudEnabled;
        if (loadDataCloudBtn) loadDataCloudBtn.disabled = !isCloudEnabled;

        if (saveDataCloudBtn) saveDataCloudBtn.style.display = isCloudEnabled ? 'inline-block' : 'none';
        if (loadDataCloudBtn) loadDataCloudBtn.style.display = isCloudEnabled ? 'inline-block' : 'none';

        if (isCloudEnabled) {
            initializeFirebase();
            document.getElementById('userIdDisplay').textContent = translations[currentLanguage]['userIdDisplayLoading'];
        } else {
            firebaseApp = null;
            db = null;
            auth = null;
            userId = null;
            document.getElementById('userIdDisplay').textContent = translations[currentLanguage]['userIdDisplayCloudDisabled'];
            console.info("Ciri Awan dilumpuhkan secara manual. Firebase tidak akan diakses.");
        }
    }

    // 3. Update Date and Time Display
    function updateDateTime() {
        const now = new Date();
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        const dateTimeString = now.toLocaleDateString(getLocaleForLanguage(currentLanguage), options); // Use locale based on selected language
        document.getElementById('currentDateTimeDisplay').textContent = `${translations[currentLanguage]['currentDateTimeDisplay']} ${dateTimeString}`;
    }

    function getLocaleForLanguage(lang) {
        switch(lang) {
            case 'ms': return 'ms-MY';
            case 'en': return 'en-US';
            case 'zh': return 'zh-CN';
            default: return 'ms-MY';
        }
    }


    // 4. Button State Management (Load & Save)
    function loadButtonStates() {
        document.querySelectorAll('.indicator-button').forEach(button => {
            const pair = button.dataset.pair;
            const indicator = button.dataset.indicator;
            const timeframe = button.dataset.timeframe;
            const key = `${pair}-${indicator}-${timeframe}`;
            const savedState = localStorage.getItem(key);

            if (savedState !== null) {
                button.dataset.state = savedState;
                button.className = 'indicator-button dot-' + savedState;
            } else {
                button.dataset.state = '0'; // Default to grey/neutral
                button.className = 'indicator-button dot-0';
                localStorage.setItem(key, '0');
            }
        });
    }

    // Function to set button states from loaded data
    function setButtonStates(data) {
        indicators.forEach(indicator => {
            timeframes.forEach(timeframe => {
                for (const pair in data.pairStates) {
                    if (data.pairStates.hasOwnProperty(pair)) {
                        const key = `${pair}-${indicator}-${timeframe}`;
                        const button = document.getElementById(`${pair.toLowerCase()}_${indicator.toLowerCase()}_${timeframe.toLowerCase()}`);
                        if (button && data.pairStates[pair][indicator] && data.pairStates[pair][indicator][timeframe] !== undefined) {
                            const state = data.pairStates[pair][indicator][timeframe].toString();
                            button.dataset.state = state;
                            button.className = 'indicator-button dot-' + state;
                            localStorage.setItem(key, state); // Update localStorage
                        }
                    }
                }
            });
        });
    }


    function saveButtonState(button) {
        const pair = button.dataset.pair;
        const indicator = button.dataset.indicator;
        const timeframe = button.dataset.timeframe;
        const key = `${pair}-${indicator}-${timeframe}`;
        localStorage.setItem(key, button.dataset.state);
    }

    // 5. Event Listeners
    pairSelector.addEventListener('change', (event) => {
        const selectedPair = event.target.value;
        localStorage.setItem('selectedPair', selectedPair); // Save selected pair
        showPairSection(selectedPair); // This will now correctly trigger updates
    });

    // Attach click listeners to all indicator buttons
    document.querySelectorAll('.indicator-button').forEach(button => {
        button.addEventListener('click', () => {
            let currentState = parseInt(button.dataset.state);
            currentState = (currentState + 1) % dotStates.length; // Cycle through states
            button.dataset.state = currentState.toString();
            button.className = 'indicator-button dot-' + currentState;
            saveButtonState(button);

            const currentPair = document.getElementById('pairSelector').value;
            performSimulation(currentPair); // Auto-update results for the current pair
            generateDotMappingTable(currentPair); // Auto-update prediction tables (now only dot mapping)
            updateRiskHeatmap(currentPair); // Update heatmap when indicator state changes
        });
    });

    // Attach click listeners to all simulate buttons
    document.querySelectorAll('.simulate-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const pair = event.target.dataset.pair;
            performSimulation(pair);
            generateDotMappingTable(pair); // Generate prediction tables (now only dot mapping)
            updateRiskHeatmap(pair); // Update heatmap when simulation is run
            saveSimulationToHistory(pair); // Save simulation to history
        });
    });

    // Attach input listeners for price inputs to save
    function attachPriceInputListeners(pair) {
        const buyInput = document.getElementById(`buyPriceInput${pair}`);
        const sellInput = document.getElementById(`sellPriceInput${pair}`);
        const ptsInput = document.getElementById(`ptsScoreInput${pair}`);

        // Load saved prices on section display
        if (buyInput) {
            buyInput.value = localStorage.getItem(`buyPrice_${pair}`) || '';
            buyInput.addEventListener('input', () => localStorage.setItem(`buyPrice_${pair}`, buyInput.value));
        }
        if (sellInput) {
            sellInput.value = localStorage.getItem(`sellPrice_${pair}`) || '';
            sellInput.addEventListener('input', () => localStorage.setItem(`sellPrice_${pair}`, sellInput.value));
        }
        if (ptsInput) {
            ptsInput.value = localStorage.getItem(`ptsScore_${pair}`) || '0';
            currentPTSValues[pair] = parseFloat(ptsInput.value);
            ptsInput.addEventListener('change', () => {
                const currentPair = document.getElementById('pairSelector').value; 
                localStorage.setItem(`ptsScore_${currentPair}`, ptsInput.value); 
                currentPTSValues[currentPair] = parseFloat(ptsInput.value); 
                performSimulation(currentPair); 
                generateDotMappingTable(currentPair); 
                updateRiskHeatmap(currentPair); 
            });
        }
    }

    // Function to set price inputs from loaded data
    function setPriceInputs(data) {
        for (const pair in data.pairPrices) {
            if (data.pairPrices.hasOwnProperty(pair)) {
                const buyInput = document.getElementById(`buyPriceInput${pair}`);
                const sellInput = document.getElementById(`sellPriceInput${pair}`);
                const ptsInput = document.getElementById(`ptsScoreInput${pair}`);

                if (buyInput && data.pairPrices[pair].buyPrice !== undefined) {
                    buyInput.value = data.pairPrices[pair].buyPrice;
                    localStorage.setItem(`buyPrice_${pair}`, data.pairPrices[pair].buyPrice);
                }
                if (sellInput && data.pairPrices[pair].sellPrice !== undefined) {
                    sellInput.value = data.pairPrices[pair].sellPrice;
                    localStorage.setItem(`sellPrice_${pair}`, data.pairPrices[pair].sellPrice);
                }
                if (ptsInput && data.pairPrices[pair].ptsScore !== undefined) {
                    ptsInput.value = data.pairPrices[pair].ptsScore;
                    localStorage.setItem(`ptsScore_${pair}`, data.pairPrices[pair].ptsScore);
                    currentPTSValues[pair] = parseFloat(data.pairPrices[pair].ptsScore);
                }
            }
        }
    }


    // 6. Section Display Logic
    function showPairSection(selectedPair) {
        // Hide all main pair sections
        for (const pairId in pairSections) {
            if (pairSections.hasOwnProperty(pairId) && pairSections[pairId]) {
                pairSections[pairId].style.display = 'none';
            }
        }

        // Show the selected main pair section
        if (pairSections[selectedPair]) {
            pairSections[selectedPair].style.display = 'block';
            // IMPORTANT: Re-attach listeners and load prices every time section is shown
            attachPriceInputListeners(selectedPair); 
            
            // Heatmap is now static in HTML, just update its colors
            updateRiskHeatmap(selectedPair);

            performSimulation(selectedPair);
            // This is the crucial call to ensure the main dot mapping table is updated
            generateDotMappingTable(selectedPair); 
        }
    }

    // 7. Simulation Logic
    function performSimulation(pair) {
        let htsScore = 0;
        const timeframeScores = { 'M15': 0, 'H1': 0, 'H4': 0 };
        const dotCounts = {
            'green': 0, 'red': 0, 'yellow': 0,
            'yellow-up': 0, 'yellow-down': 0, 'white': 0
        };

        // Calculate HTS Score and dot counts
        indicators.forEach(indicator => {
            timeframes.forEach(timeframe => {
                const key = `${pair}-${indicator}-${timeframe}`;
                const state = parseInt(localStorage.getItem(key) || '0');
                const dotColor = dotStates[state];

                dotCounts[dotColor]++;

                let scoreToAdd = 0;
                switch (dotColor) {
                    case 'green':
                    case 'yellow-up':
                        scoreToAdd = 1;
                        break;
                    case 'red':
                    case 'yellow-down':
                        scoreToAdd = -1;
                        break;
                    case 'white':
                    case 'grey': // Assuming grey is neutral too
                    case 'yellow':
                    default:
                        scoreToAdd = 0;
                        break;
                }

                if (timeframe !== 'Day1') { // Day1 does not contribute to HTS Score or timeframe status
                    htsScore += scoreToAdd;
                    timeframeScores[timeframe] += scoreToAdd;
                }
            });
        });

        // Get PTS Score
        const ptsScoreInput = document.getElementById(`ptsScoreInput${pair}`);
        const ptsScore = parseFloat(ptsScoreInput ? ptsScoreInput.value : '0'); // Add null check
        currentPTSValues[pair] = ptsScore; // Update global PTS value

        // Calculate Delta-X Total (HTS + PTS)
        const deltaXTotal = htsScore + ptsScore;

        // Determine Grail Confidence
        let grailConfidence = 0;
        if (deltaXTotal >= 9) {
            grailConfidence = 90;
        } else if (deltaXTotal >= 7) {
            grailConfidence = 70;
        } else if (deltaXTotal >= 5) {
            grailConfidence = 50;
        } else if (deltaXTotal <= -9) {
            grailConfidence = 90; // For strong sell
        } else if (deltaXTotal <= -7) {
            grailConfidence = 70;
        } else if (deltaXTotal <= -5) {
            grailConfidence = 50;
        } else {
            grailConfidence = 30; // Neutral or low confidence
        }

        // Determine Confidence Level and Prediction Result
        let confidenceLevel = translations[currentLanguage]['noData'];
        let predictionResult = translations[currentLanguage]['noPrediction'];
        let hasRiskWarning = false;

        if (deltaXTotal >= 6 && htsScore >= 6) {
            confidenceLevel = translations[currentLanguage]['highConfidence'];
            predictionResult = translations[currentLanguage]['buyEntry'];
        } else if (deltaXTotal <= -6 && htsScore <= -6) {
            confidenceLevel = translations[currentLanguage]['highConfidence'];
            predictionResult = translations[currentLanguage]['sellEntry'];
        } else if (deltaXTotal >= 3) {
            confidenceLevel = translations[currentLanguage]['mediumConfidence'];
            predictionResult = translations[currentLanguage]['potentialBuyEntry'];
        } else if (deltaXTotal <= -3) {
            confidenceLevel = translations[currentLanguage]['mediumConfidence'];
            predictionResult = translations[currentLanguage]['potentialSellEntry'];
        } else if (deltaXTotal >= 0.5 || deltaXTotal <= -0.5) {
            confidenceLevel = translations[currentLanguage]['lowConfidence'];
            predictionResult = translations[currentLanguage]['sidewatchWaitingEntry'];
        } else {
            confidenceLevel = translations[currentLanguage]['noClearDirection'];
            predictionResult = translations[currentLanguage]['sidewatchWaitingEntry'];
        }

        // Specific HTS score risk warning
        const riskWarningDiv = document.getElementById(`riskWarning${pair}`);
        if (riskWarningDiv) { // Add null check for riskWarningDiv
            if (htsScore < 6 && htsScore > -6) { // If HTS is between -6 and 6 (exclusive of -6 and 6)
                riskWarningDiv.textContent = translations[currentLanguage]['riskWarning'].replace('{pair}', pair);
                riskWarningDiv.style.display = 'block';
                hasRiskWarning = true;
                // Override prediction if risk is high
                confidenceLevel = translations[currentLanguage]['sidewatchWaitingEntry']; // Changed to use translated string
                predictionResult = translations[currentLanguage]['sidewatchWaitingEntry']; // Changed to use translated string
            } else {
                riskWarningDiv.style.display = 'none';
            }
        }


        // Determine M15, H1, H4 Status
        const getStatus = (score) => {
            if (score > 0) return translations[currentLanguage]['bullishBias'];
            if (score < 0) return translations[currentLanguage]['bearishBias'];
            return translations[currentLanguage]['mixedNeutralBias'];
        };

        const m15Status = getStatus(timeframeScores['M15']);
        const h1Status = getStatus(timeframeScores['H1']);
        const h4Status = getStatus(timeframeScores['H4']);


        // 8. Update Display
        const htsDisplay = document.getElementById(`htsScoreDisplay${pair}`);
        if (htsDisplay) htsDisplay.textContent = htsScore.toFixed(1);
        const ptsDisplay = document.getElementById(`ptsScoreDisplay${pair}`);
        if (ptsDisplay) ptsDisplay.textContent = ptsScore.toFixed(1);
        const deltaXDisplay = document.getElementById(`deltaXScoreDisplay${pair}`);
        if (deltaXDisplay) deltaXDisplay.textContent = deltaXTotal.toFixed(1);
        const grailConfidenceDisplay = document.getElementById(`grailConfidenceDisplay${pair}`);
        if (grailConfidenceDisplay) grailConfidenceDisplay.textContent = grailConfidence.toFixed(0);
        const confidenceLevelDisplay = document.getElementById(`confidenceLevelDisplay${pair}`);
        if (confidenceLevelDisplay) confidenceLevelDisplay.textContent = confidenceLevel;
        const predictionResultDisplay = document.getElementById(`predictionResultDisplay${pair}`);
        if (predictionResultDisplay) predictionResultDisplay.textContent = predictionResult;

        const m15StatusDisplay = document.getElementById(`${pair.toLowerCase()}M15Status`);
        if (m15StatusDisplay) m15StatusDisplay.textContent = m15Status;
        const h1StatusDisplay = document.getElementById(`${pair.toLowerCase()}H1Status`);
        if (h1StatusDisplay) h1StatusDisplay.textContent = h1Status;
        const h4StatusDisplay = document.getElementById(`${pair.toLowerCase()}H4Status`);
        if (h4StatusDisplay) h4StatusDisplay.textContent = h4Status;
    }

    // 9. Generate Dot Mapping Table
    function generateDotMappingTable(pair) {
        // Use the correct ID for the prediction table body based on the pair
        const predictionTableBody = document.getElementById(`predictionTableBody${pair}`);
        if (!predictionTableBody) {
            console.error(`Elemen predictionTableBody${pair} tidak ditemui.`);
            return; // Exit if element not found
        }

        predictionTableBody.innerHTML = ''; // Clear previous content

        indicators.forEach(indicatorName => {
            const row = document.createElement('tr');
            const indicatorCell = document.createElement('td');
            // Use translated indicator labels
            indicatorCell.textContent = indicatorName === 'EMA' ? translations[currentLanguage]['emaLabel'] :
                                         indicatorName === 'BB' ? translations[currentLanguage]['bbLabel'] :
                                         indicatorName === 'RSI' ? translations[currentLanguage]['rsiLabel'] :
                                         translations[currentLanguage]['macdLabel'];
            row.appendChild(indicatorCell);

            timeframes.forEach(timeframe => {
                const cell = document.createElement('td');
                const key = `${pair}-${indicatorName}-${timeframe}`;
                const state = parseInt(localStorage.getItem(key) || '0');
                const dotLabel = dotStateLabels[currentLanguage][state]; // Get the label string from current language
                const dotClass = dotStates[state]; // Get the class name (e.g., 'green', 'red')

                // Map dot class to text class for styling in the prediction table
                let textClass = '';
                switch(dotClass) {
                    case 'green':
                        textClass = 'buy-text';
                        break;
                    case 'red':
                        textClass = 'sell-text';
                        break;
                    case 'yellow':
                        textClass = 'neutral-text';
                        break;
                    case 'yellow-up':
                        textClass = 'buy-potential-text';
                        break;
                    case 'yellow-down':
                        textClass = 'sell-potential-text';
                        break;
                    case 'white':
                        textClass = 'mixed-text';
                        break;
                    default:
                        textClass = 'neutral-text'; // Default for 'grey' or others
                }
                cell.textContent = dotLabel;
                cell.classList.add(textClass); // Add appropriate class for text color
                row.appendChild(cell);
            });
            predictionTableBody.appendChild(row);
        });
    }

    // 10. Generate Heatmap Cells (This function is now largely redundant as HTML defines structure)
    // It's kept for initial setup but will mostly be a no-op after first load
    function generateHeatmapCells(pair) {
        // Since the heatmap structure is now in HTML, this function primarily ensures
        // the grid is present and correctly sized by CSS.
        // We no longer need to dynamically create all 81 divs here.
        // The HTML already contains the 9x9 grid with labels and data cells.
        const gridContainer = document.getElementById(`riskHeatmapGrid${pair}`);
        if (!gridContainer) return;

        // Ensure the grid template is correctly set by CSS
        // This is crucial for the heatmap layout
        gridContainer.style.gridTemplateColumns = `auto repeat(${dataGridCols * heatmapCellSpan}, 1fr)`;
        gridContainer.style.gridTemplateRows = `auto repeat(${dataGridRows * heatmapCellSpan}, 1fr)`;
    }


    // 11. Update Risk Heatmap based on Dot Mapping for a specific pair
    function updateRiskHeatmap(pair) {
        const gridContainer = document.getElementById(`riskHeatmapGrid${pair}`);
        if (!gridContainer) {
            console.error(`Elemen riskHeatmapGrid${pair} tidak ditemui.`);
            return;
        }

        // Get all data cells by their data-row and data-col attributes
        // This is a more robust way to select specific cells
        const dataCellsMap = new Map();
        gridContainer.querySelectorAll('.heatmap-cell').forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            if (!isNaN(row) && !isNaN(col)) {
                dataCellsMap.set(`${row}-${col}`, cell);
            }
        });
        
        const currentExpectedDataCellCount = dataGridRows * dataGridCols * heatmapCellSpan * heatmapCellSpan; // Define locally for this function
        if (dataCellsMap.size !== currentExpectedDataCellCount) {
            console.error(`Heatmap data cell count mismatch! Expected: ${currentExpectedDataCellCount}, Found: ${dataCellsMap.size} for pair ${pair}`);
            return; // Exit to prevent further errors
        }

        // Iterate through the 4x4 logical grid of indicator-timeframe pairs
        indicators.forEach((indicatorName, indIdx) => {
            timeframes.forEach((timeframe, tfIdx) => {
                const key = `${pair}-${indicatorName}-${timeframe}`;
                const state = parseInt(localStorage.getItem(key) || '0');
                const heatmapColorClassIndex = dotStateToHeatmapColorMap[state];
                const colorClass = `color-${heatmapColorClassIndex}`;

                // Calculate the starting row and column for the 2x2 block within the 8x8 data grid
                const startDataRow = indIdx * heatmapCellSpan; // 0, 2, 4, 6
                const startDataCol = tfIdx * heatmapCellSpan; // 0, 2, 4, 6

                // Apply color to the 4 cells in the 2x2 block
                for (let rOffset = 0; rOffset < heatmapCellSpan; rOffset++) {
                    for (let cOffset = 0; cOffset < heatmapCellSpan; cOffset++) {
                        const targetDataRow = startDataRow + rOffset;
                        const targetDataCol = startDataCol + cOffset;
                        
                        const cell = dataCellsMap.get(`${targetDataRow}-${targetDataCol}`);
                        if (cell) {
                            cell.className = 'heatmap-cell'; // Reset classes
                            cell.classList.add(colorClass);
                        }
                    }
                }
            });
        });
    }

    // Helper function to get current dot states for a given pair
    function getDotStatesForPair(pair) {
        const currentDotStates = [];
        indicators.forEach(indicatorName => {
            timeframes.forEach(timeframe => {
                const key = `${pair}-${indicatorName}-${timeframe}`;
                const state = parseInt(localStorage.getItem(key) || '0');
                currentDotStates.push(state);
            });
        });
        return currentDotStates; // This will be an array of 16 integers (0-6)
    }

    // Helper function to get current dot mapping labels for a given pair (4x4 array of strings)
    function getDotMappingLabelsForPair(pair) {
        const dotMapping = [];
        indicators.forEach(indicatorName => {
            const rowLabels = [];
            timeframes.forEach(timeframe => {
                const key = `${pair}-${indicatorName}-${timeframe}`;
                const state = parseInt(localStorage.getItem(key) || '0');
                rowLabels.push(dotStateLabels[currentLanguage][state]); // Use current language
            });
            dotMapping.push(rowLabels);
        });
        return dotMapping; // This will be a 4x4 array of label strings
    }


    // Helper function to render a small static heatmap for history/print
    function renderStaticHeatmap(parentEl, dotStatesArray) {
        const historyHeatmapGrid = document.createElement('div');
        historyHeatmapGrid.classList.add('history-heatmap-grid');

        // Set grid template columns/rows for the 9x9 layout
        // This is crucial for the heatmap layout
        historyHeatmapGrid.style.gridTemplateColumns = `auto repeat(${dataGridCols * heatmapCellSpan}, 1fr)`;
        historyHeatmapGrid.style.gridTemplateRows = `auto repeat(${dataGridRows * heatmapCellSpan}, 1fr)`;

        // Create the top-left empty corner cell
        const emptyCorner = document.createElement('div');
        emptyCorner.classList.add('history-heatmap-label-cell');
        emptyCorner.textContent = '';
        historyHeatmapGrid.appendChild(emptyCorner);

        // Create top row labels (timeframes)
        timeframeLabels[currentLanguage].forEach(label => { // Use translated timeframe labels
            const cell = document.createElement('div');
            cell.classList.add('history-heatmap-label-cell');
            cell.textContent = label;
            cell.style.gridColumn = `span ${heatmapCellSpan}`; // Each label spans 2 data columns
            historyHeatmapGrid.appendChild(cell);
        });

        // Create the rest of the grid (indicator labels + data cells)
        const historyDataCellsMap = new Map(); // Use a map for history cells too
        for (let r = 0; r < dataGridRows; r++) { // Loop for logical indicator rows (0-3)
            // Add indicator label cell for this row
            const labelCell = document.createElement('div');
            labelCell.classList.add('history-heatmap-label-cell');
            labelCell.textContent = indicatorLabels[currentLanguage][r]; // Use translated indicator labels
            labelCell.style.gridRow = `span ${heatmapCellSpan}`; // Each label spans 2 data rows
            historyHeatmapGrid.appendChild(labelCell);

            // Now, generate the data cells for the 2 actual grid rows associated with this logical indicator row
            for (let rOffset = 0; rOffset < heatmapCellSpan; rOffset++) { // Loop 2 times for actual rows within the 2x2 block
                for (let c = 0; c < dataGridCols * heatmapCellSpan; c++) { // Loop 8 times for actual columns
                    const dataCell = document.createElement('div');
                    dataCell.classList.add('history-heatmap-cell');
                    
                    // The actual row in the 8x8 data grid
                    const actualDataRow = (r * heatmapCellSpan) + rOffset;
                    // The actual column in the 8x8 data grid
                    const actualDataCol = c; 

                    dataCell.dataset.row = actualDataRow;
                    dataCell.dataset.col = actualDataCol;
                    historyDataCellsMap.set(`${actualDataRow}-${actualDataCol}`, dataCell);
                    historyHeatmapGrid.appendChild(dataCell);
                }
            }
        }

        // Now, apply colors to the data cells
        const expectedDataCellCount = dataGridRows * dataGridCols * heatmapCellSpan * heatmapCellSpan; // Define locally for this function
        if (historyDataCellsMap.size !== expectedDataCellCount) {
            console.error(`History Heatmap data cell count mismatch! Expected: ${expectedDataCellCount}, Found: ${historyDataCellsMap.size}`);
            return; // Exit to prevent further errors
        }

        indicators.forEach((indicatorName, indIdx) => {
            timeframes.forEach((timeframe, tfIdx) => {
                const dotStateArrayIndex = indIdx * timeframes.length + tfIdx;
                let state = dotStatesArray[dotStateArrayIndex];
                
                if (state === undefined || isNaN(state)) {
                    state = 0; // Fallback for missing/invalid data, e.g., default to neutral color
                }

                const heatmapColorClassIndex = dotStateToHeatmapColorMap[state];
                const colorClass = `color-${heatmapColorClassIndex}`;

                // Calculate the starting row and column for the 2x2 block within the 8x8 data grid
                const startDataRow = indIdx * heatmapCellSpan;
                const startDataCol = tfIdx * heatmapCellSpan;

                // Apply color to the 4 cells in the 2x2 block
                for (let rOffset = 0; rOffset < heatmapCellSpan; rOffset++) {
                    for (let cOffset = 0; cOffset < heatmapCellSpan; cOffset++) {
                        const targetDataRow = startDataRow + rOffset;
                        const targetDataCol = startDataCol + cOffset;
                        
                        const cell = historyDataCellsMap.get(`${targetDataRow}-${targetDataCol}`);
                        if (cell) {
                            cell.classList.add(colorClass);
                        }
                    }
                }
            });
        });
        parentEl.appendChild(historyHeatmapGrid);
        return historyHeatmapGrid; // Return the created grid element
    }


    // Helper to get class for history item result for styling
    function getPredictionResultClass(result) {
        const currentLang = currentLanguage; // Use current language
        if (result.includes(translations[currentLang]['buyEntry'])) return 'long-buy';
        if (result.includes(translations[currentLang]['sellEntry'])) return 'long-sell';
        if (result.includes(translations[currentLang]['sidewatchWaitingEntry'])) return 'waiting-entry';
        return 'neutral-text';
    }

    // 12. Simulation History Functions (Moved here for proper scope)
    function saveSimulationToHistory(pair) {
        const now = new Date();
        const timestamp = now.toLocaleString(getLocaleForLanguage(currentLanguage)); // Use locale for timestamp
        const htsScore = document.getElementById(`htsScoreDisplay${pair}`) ? document.getElementById(`htsScoreDisplay${pair}`).textContent : '--';
        const ptsScore = document.getElementById(`ptsScoreInput${pair}`) ? document.getElementById(`ptsScoreInput${pair}`).value : '--'; // Use .value for input
        const deltaXTotal = document.getElementById(`deltaXScoreDisplay${pair}`) ? document.getElementById(`deltaXScoreDisplay${pair}`).textContent : '--';
        const grailConfidence = document.getElementById(`grailConfidenceDisplay${pair}`) ? document.getElementById(`grailConfidenceDisplay${pair}`).textContent : '--%';
        const confidenceLevel = document.getElementById(`confidenceLevelDisplay${pair}`) ? document.getElementById(`confidenceLevelDisplay${pair}`).textContent : translations[currentLanguage]['noData']; // Use translated string
        const predictionResult = document.getElementById(`predictionResultDisplay${pair}`) ? document.getElementById(`predictionResultDisplay${pair}`).textContent : translations[currentLanguage]['noPrediction']; // Use translated string
        
        const buyPriceInput = document.getElementById(`buyPriceInput${pair}`);
        const sellPriceInput = document.getElementById(`sellPriceInput${pair}`);
        const buyPrice = buyPriceInput ? buyPriceInput.value : '';
        const sellPrice = sellPriceInput ? sellPriceInput.value : '';

        const currentHeatmapDotStates = getDotStatesForPair(pair);
        const currentDotMappingLabels = getDotMappingLabelsForPair(pair);


        const historyItem = {
            timestamp,
            pair,
            htsScore,
            ptsScore,
            deltaXTotal,
            grailConfidence,
            confidenceLevel,
            predictionResult,
            buyPrice, 
            sellPrice, 
            heatmapData: currentHeatmapDotStates,
            dotMappingData: currentDotMappingLabels
        };

        let history = JSON.parse(localStorage.getItem('simulationHistory')) || [];
        history.push(historyItem);
        localStorage.setItem('simulationHistory', JSON.stringify(history));
        renderSimulationHistory();
    }

    function renderSimulationHistory() {
        if (!simulationHistoryList) {
            console.error("Elemen simulationHistoryList tidak ditemui.");
            return;
        }
        simulationHistoryList.innerHTML = '';
        let history = JSON.parse(localStorage.getItem('simulationHistory')) || [];

        if (history.length === 0) {
            simulationHistoryList.innerHTML = `<p style="text-align: center; color: #777;">${translations[currentLanguage]['noHistoryYet']}</p>`;
            return;
        }

        history.forEach((item, index) => {
            const div = document.createElement('div');
            div.classList.add('history-item');
            div.innerHTML = `
                <strong>${translations[currentLanguage]['historyItemPrefix']} ${index + 1}. ${item.pair}</strong> (${item.timestamp})<br>
                ${translations[currentLanguage]['historyHTS']} ${item.htsScore} | ${translations[currentLanguage]['historyPTS']} ${item.ptsScore} | ${translations[currentLanguage]['historyDeltaX']} ${item.deltaXTotal}<br>
                ${translations[currentLanguage]['historyConfidence']} ${item.grailConfidence}% | ${translations[currentLanguage]['historyLevel']} ${item.confidenceLevel}<br>
                ${translations[currentLanguage]['historyResult']} <span class="${getPredictionResultClass(item.predictionResult)}">${item.predictionResult}</span><br>
                ${translations[currentLanguage]['historyBuyPrice']} <strong>${item.buyPrice || translations[currentLanguage]['historyNAText']}</strong> | ${translations[currentLanguage]['historySellPrice']} <strong>${item.sellPrice || translations[currentLanguage]['historyNAText']}</strong>
            `;

            if (item.dotMappingData && Array.isArray(item.dotMappingData) && item.dotMappingData.length === dataGridRows) {
                const dotMappingTableHtml = `
                    <div class="history-dot-mapping-container" style="margin-top: 15px; border: 1px solid #004400; border-radius: 5px; overflow: hidden;">
                        <h4 style="color: #00ffff; text-align: center; margin: 10px 0; font-size: 1em;">${translations[currentLanguage]['historyDotMappingTitle']}</h4>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="padding: 5px; text-align: center; border: 1px solid #003300; background-color: rgba(0, 51, 0, 0.7); color: #00ff00; font-size: 0.8em;">${translations[currentLanguage]['predIndicatorHeader']}</th>
                                    ${timeframeLabels[currentLanguage].map(label => `<th style="padding: 5px; text-align: center; border: 1px solid #003300; background-color: rgba(0, 51, 0, 0.7); color: #00ff00; font-size: 0.8em;">${label}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${item.dotMappingData.map((row, rIdx) => `
                                    <tr>
                                        <td style="padding: 5px; text-align: center; border: 1px solid #003300; color: #e0e0e0; font-size: 0.75em;">${indicatorLabels[currentLanguage][rIdx]}</td>
                                        ${row.map(cellLabel => {
                                            let textClass = '';
                                            // Map label string back to its class for styling
                                            // This requires checking against translated labels
                                            if (cellLabel === dotStateLabels[currentLanguage][1]) textClass = 'buy-text';
                                            else if (cellLabel === dotStateLabels[currentLanguage][2]) textClass = 'sell-text';
                                            else if (cellLabel === dotStateLabels[currentLanguage][3]) textClass = 'neutral-text';
                                            else if (cellLabel === dotStateLabels[currentLanguage][4]) textClass = 'buy-potential-text';
                                            else if (cellLabel === dotStateLabels[currentLanguage][5]) textClass = 'sell-potential-text';
                                            else if (cellLabel === dotStateLabels[currentLanguage][6]) textClass = 'mixed-text';
                                            else textClass = 'neutral-text';
                                            
                                            return `<td class="${textClass}" style="padding: 5px; text-align: center; border: 1px solid #003300; font-size: 0.75em;">${cellLabel}</td>`;
                                        }).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                div.innerHTML += dotMappingTableHtml;
            }

            if (item.heatmapData && Array.isArray(item.heatmapData) && item.heatmapData.length === 16) {
                renderStaticHeatmap(div, item.heatmapData);
            }
            simulationHistoryList.appendChild(div);
        });
    }

    function loadSimulationHistory() {
        renderSimulationHistory();
    }

    // 13. Local Data Save/Load Functions (Moved here for proper scope)
    function saveDataToFile() {
        const dataToSave = {
            selectedPair: localStorage.getItem('selectedPair'),
            selectedLanguage: currentLanguage, // Save selected language
            pairStates: {},
            pairPrices: {},
            simulationHistory: JSON.parse(localStorage.getItem('simulationHistory')) || []
        };

        ['USDJPY', 'EURJPY', 'GOLD'].forEach(pair => {
            dataToSave.pairStates[pair] = {};
            indicators.forEach(indicator => {
                dataToSave.pairStates[pair][indicator] = {};
                timeframes.forEach(timeframe => {
                    const key = `${pair}-${indicator}-${timeframe}`;
                    dataToSave.pairStates[pair][indicator][timeframe] = parseInt(localStorage.getItem(key) || '0');
                });
            });

            dataToSave.pairPrices[pair] = {
                buyPrice: localStorage.getItem(`buyPrice_${pair}`) || '',
                sellPrice: localStorage.getItem(`sellPrice_${pair}`) || '',
                ptsScore: localStorage.getItem(`ptsScore_${pair}`) || '0'
            };
        });

        const jsonData = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `enoviax_ems_data_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(translations[currentLanguage]['alertLocalSaveSuccess']);
    }

    function loadDataFromFile(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);

                localStorage.clear();

                if (loadedData.selectedPair) {
                    localStorage.setItem('selectedPair', loadedData.selectedPair);
                    pairSelector.value = loadedData.selectedPair;
                }
                // Load and apply language preference first
                if (loadedData.selectedLanguage) {
                    localStorage.setItem('selectedLanguage', loadedData.selectedLanguage);
                    languageSelect.value = loadedData.selectedLanguage;
                    updateLanguage(loadedData.selectedLanguage); // Apply language immediately
                } else {
                    updateLanguage(currentLanguage); // Apply current default/stored language
                }


                if (loadedData.pairStates) {
                    setButtonStates(loadedData);
                }

                if (loadedData.pairPrices) {
                    setPriceInputs(loadedData);
                }

                if (loadedData.simulationHistory) {
                    localStorage.setItem('simulationHistory', JSON.stringify(loadedData.simulationHistory));
                }

                showPairSection(localStorage.getItem('selectedPair') || 'USDJPY');
                renderSimulationHistory();
                alert(translations[currentLanguage]['alertLocalLoadSuccess']);

            } catch (error) {
                console.error('Ralat memuatkan fail:', error);
                alert(translations[currentLanguage]['alertLocalLoadError']);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; 
    }

    // 14. Cloud Data Save/Load Functions (Moved here for proper scope)
    async function saveDataToCloud() {
        if (!enableCloudToggle.checked) {
            alert(translations[currentLanguage]['alertCloudDisabledSave']);
            return;
        }

        if (!db || !userId) {
            alert(translations[currentLanguage]['alertFirebaseNotReady']);
            console.error('Firestore atau User ID tidak tersedia untuk menyimpan data awan. db:', db, 'userId:', userId);
            return;
        }

        loadingIndicator.style.display = 'block';

        try {
            const dataToSave = {
                selectedPair: localStorage.getItem('selectedPair'),
                selectedLanguage: currentLanguage, // Save selected language
                pairStates: {},
                pairPrices: {},
                simulationHistory: JSON.parse(localStorage.getItem('simulationHistory')) || []
            };

            ['USDJPY', 'EURJPY', 'GOLD'].forEach(pair => {
                dataToSave.pairStates[pair] = {};
                indicators.forEach(indicator => {
                    dataToSave.pairStates[pair][indicator] = {};
                    timeframes.forEach(timeframe => {
                        const key = `${pair}-${indicator}-${timeframe}`;
                        dataToSave.pairStates[pair][indicator][timeframe] = parseInt(localStorage.getItem(key) || '0');
                    });
                });

                dataToSave.pairPrices[pair] = {
                    buyPrice: localStorage.getItem(`buyPrice_${pair}`) || '',
                    sellPrice: localStorage.getItem(`sellPrice_${pair}`) || '',
                    ptsScore: localStorage.getItem(`ptsScore_${pair}`) || '0'
                };
            });

            const docRef = window.firebase.doc(db, `artifacts/${appId}/users/${userId}/ems_data/current_state`);
            await window.firebase.setDoc(docRef, dataToSave);
            alert(translations[currentLanguage]['alertCloudSaveSuccess']);
        } catch (error) {
            console.error('Ralat menyimpan data ke awan:', error);
            alert(translations[currentLanguage]['alertCloudSaveError']);
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    async function loadDataFromCloud() {
        if (!enableCloudToggle.checked) {
            alert(translations[currentLanguage]['alertCloudDisabledSave']);
            return;
        }

        if (!db || !userId) {
            alert(translations[currentLanguage]['alertFirebaseNotReady']);
            console.error('Firestore atau User ID tidak tersedia untuk memuatkan data awan. db:', db, 'userId:', userId);
            return;
        }

        loadingIndicator.style.display = 'block';

        try {
            const docRef = window.firebase.doc(db, `artifacts/${appId}/users/${userId}/ems_data/current_state`);
            const docSnap = await window.firebase.getDoc(docRef);

            if (docSnap.exists()) {
                const loadedData = docSnap.data();
                
                localStorage.clear();

                if (loadedData.selectedPair) {
                    localStorage.setItem('selectedPair', loadedData.selectedPair);
                    pairSelector.value = loadedData.selectedPair;
                }
                // Load and apply language preference first
                if (loadedData.selectedLanguage) {
                    localStorage.setItem('selectedLanguage', loadedData.selectedLanguage);
                    languageSelect.value = loadedData.selectedLanguage;
                    updateLanguage(loadedData.selectedLanguage); // Apply language immediately
                } else {
                    updateLanguage(currentLanguage); // Apply current default/stored language
                }

                if (loadedData.pairStates) {
                    setButtonStates(loadedData);
                }

                if (loadedData.pairPrices) {
                    setPriceInputs(loadedData);
                }

                if (loadedData.simulationHistory) {
                    localStorage.setItem('simulationHistory', JSON.stringify(loadedData.simulationHistory));
                }

                showPairSection(localStorage.getItem('selectedPair') || 'USDJPY');
                renderSimulationHistory();
                alert(translations[currentLanguage]['alertCloudLoadSuccess']);
            } else {
                alert(translations[currentLanguage]['alertNoCloudData']);
            }
        } catch (error) {
            console.error('Ralat memuatkan data dari awan:', error);
            alert(translations[currentLanguage]['alertCloudLoadError']);
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    // --- Function to download history as a text file ---
    function downloadHistoryAsTextFile() {
        const history = JSON.parse(localStorage.getItem('simulationHistory')) || [];
        if (history.length === 0) {
            alert(translations[currentLanguage]['alertNoHistoryDownload']);
            return;
        }

        let textContent = `${translations[currentLanguage]['appTitle']} ${translations[currentLanguage]['simulationHistoryTitle']}\n\n`;
        history.forEach((item, index) => {
            textContent += `--- ${translations[currentLanguage]['historyItemPrefix']} ${index + 1} ---\n`;
            textContent += `Pair: ${item.pair}\n`;
            textContent += `${translations[currentLanguage]['currentDateTimeDisplay']} ${item.timestamp}\n`;
            textContent += `${translations[currentLanguage]['historyHTS']} ${item.htsScore}\n`;
            textContent += `${translations[currentLanguage]['historyPTS']} ${item.ptsScore}\n`;
            textContent += `${translations[currentLanguage]['historyDeltaX']} ${item.deltaXTotal}\n`;
            textContent += `${translations[currentLanguage]['historyConfidence']} ${item.grailConfidence}%\n`;
            textContent += `${translations[currentLanguage]['historyLevel']} ${item.confidenceLevel}\n`;
            textContent += `${translations[currentLanguage]['historyResult']} ${item.predictionResult}\n`;
            textContent += `${translations[currentLanguage]['historyBuyPrice']} ${item.buyPrice || translations[currentLanguage]['historyNAText']}\n`;
            textContent += `${translations[currentLanguage]['historySellPrice']} ${item.sellPrice || translations[currentLanguage]['historyNAText']}\n`;
            
            if (item.dotMappingData && Array.isArray(item.dotMappingData)) {
                textContent += `${translations[currentLanguage]['historyDotMappingTitle']}:\n`;
                textContent += `${translations[currentLanguage]['predIndicatorHeader']}\t${timeframeLabels[currentLanguage].join('\t')}\n`; // Use translated timeframe labels
                item.dotMappingData.forEach((row, rIdx) => {
                    textContent += `${indicatorLabels[currentLanguage][rIdx]}\t${row.join('\t')}\n`; // Use translated indicator labels
                });
            }
            textContent += "\n";
        });

        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `enoviax_ems_history_${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(translations[currentLanguage]['alertTextDownloadSuccess']);
    }

    // --- Function to download history heatmaps as an HTML file ---
    function downloadHistoryHeatmapsAsHtml() {
        const history = JSON.parse(localStorage.getItem('simulationHistory')) || [];
        if (history.length === 0) {
            alert(translations[currentLanguage]['alertNoHeatmapDownload']);
            return;
        }

        let htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${translations[currentLanguage]['printHtmlTitle']}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        color: #333;
                    }
                    h1 {
                        text-align: center;
                        color: #000;
                        margin-bottom: 30px;
                    }
                    .print-item-container {
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 1px solid #eee;
                        page-break-inside: avoid;
                    }
                    .print-item-container:last-child {
                        border-bottom: none;
                    }
                    .print-item-header {
                        font-size: 1.2em;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: #000;
                    }
                    .history-heatmap-grid {
                        display: grid;
                        grid-template-columns: auto repeat(8, 1fr); 
                        grid-template-rows: auto repeat(8, 1fr); 
                        gap: 0.5px;
                        width: 200px;
                        height: 200px;
                        border: 1px solid #000;
                        border-radius: 3px;
                        overflow: hidden;
                        margin: 10px auto;
                    }
                    .history-heatmap-cell {
                        width: 100%;
                        height: 100%;
                        border-radius: 1px;
                        border: 0.25px solid rgba(0, 0, 0, 0.1);
                    }
                    .history-heatmap-label-cell {
                        background-color: #f0f0f0;
                        color: #000;
                        font-size: 0.8em;
                        font-weight: bold;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding: 2px;
                        text-align: center;
                        border: 0.25px solid rgba(0, 0, 0, 0.1);
                        border-radius: 1px;
                    }
                    .color-0 { background-color: #00cc00; }
                    .color-1 { background-color: #00aa00; }
                    .color-2 { background-color: #008800; } 
                    .color-3 { background-color: #006600; }
                    .color-4 { background-color: #cccc00; }
                    .color-5 { background-color: #cc9900; }
                    .color-6 { background-color: #cc6600; } 
                    .color-7 { background-color: #cc3300; }
                    .color-8 { background-color: #cc0000; }
                    .color-9 { background-color: #aa0000; }
                </style>
            </head>
            <body>
                <h1>${translations[currentLanguage]['printHtmlTitle']}</h1>
        `;

        history.forEach((item, index) => {
            if (item.heatmapData && Array.isArray(item.heatmapData) && item.heatmapData.length === 16) {
                const tempDiv = document.createElement('div');
                const renderedHeatmapElement = renderStaticHeatmap(tempDiv, item.heatmapData);
                
                htmlContent += `
                    <div class="print-item-container">
                        <div class="print-item-header">${translations[currentLanguage]['printHtmlSimulationPrefix']} ${index + 1}. ${item.pair} (${item.timestamp})</div>
                        ${renderedHeatmapElement ? renderedHeatmapElement.outerHTML : `<p>${translations[currentLanguage]['printHtmlHeatmapNotDisplayed']}</p>`}
                    </div>
                `;
                tempDiv.innerHTML = '';
            }
        });

        htmlContent += `
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `enoviax_ems_heatmap_history_${new Date().toISOString().slice(0,10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(translations[currentLanguage]['alertHeatmapDownloadSuccess']);
    }


    // NEW: Help Modal Content and Functions
    function populateHelpModalContent() {
        const currentTranslations = translations[currentLanguage];

        modalBody.innerHTML = `
            <h3>${currentTranslations['helpIntroTitle']}</h3>
            <p>${currentTranslations['helpIntroPara']}</p>

            <h3>${currentTranslations['helpIndicatorsTitle']}</h3>
            <ul>
                <li><strong>${currentTranslations['helpEMA']}</strong>
                    <p>${currentTranslations['helpEMADesc']}</p>
                    <ul>
                        <li><span style="color: #00ff00;">${currentTranslations['helpEMAGreen']}</span></li>
                        <li><span style="color: #ff3333;">${currentTranslations['helpEMARed']}</span></li>
                        <li><span style="color: #ffff00;">${currentTranslations['helpEMAYellow']}</span></li>
                        <li><span style="color: #99ff33;">${currentTranslations['helpEMALightGreen']}</span></li>
                        <li><span style="color: #ff9900;">${currentTranslations['helpEMAOrange']}</span></li>
                        <li><span style="color: #ffffff;">${currentTranslations['helpEMAWhite']}</span></li>
                        <li><span style="color: #333;">${currentTranslations['helpEMAGrey']}</span></li>
                    </ul>
                </li>
                <li><strong>${currentTranslations['helpBB']}</strong>
                    <p>${currentTranslations['helpBBDesc']}</p>
                </li>
                <li><strong>${currentTranslations['helpRSI']}</strong>
                    <p>${currentTranslations['helpRSIDesc']}</p>
                </li>
                <li><strong>${currentTranslations['helpMACD']}</strong>
                    <p>${currentTranslations['helpMACDDesc']}</p>
                </li>
            </ul>

            <h3>${currentTranslations['helpScoreSystemTitle']}</h3>
            <ul>
                <li><strong>${currentTranslations['helpHTS']}</strong>
                    <p>${currentTranslations['helpHTSDesc1']}</p>
                    <p>${currentTranslations['helpHTSDesc2']}</p>
                </li>
                <li><strong>${currentTranslations['helpPTS']}</strong>
                    <p>${currentTranslations['helpPTSDesc1']}</p>
                    <p>${currentTranslations['helpPTSDesc2']}</p>
                </li>
                <li><strong>${currentTranslations['helpDeltaX']}</strong>
                    <p>${currentTranslations['helpDeltaXDesc1']}</p>
                    <p>${currentTranslations['helpDeltaXDesc2']}</p>
                </li>
                <li><strong>${currentTranslations['helpGrailConfidence']}</strong>
                    <p>${currentTranslations['helpGrailConfidenceDesc1']}</p>
                    <ul>
                        <li>${currentTranslations['helpGrailConfidenceList90']}</li>
                        <li>${currentTranslations['helpGrailConfidenceList70']}</li>
                        <li>${currentTranslations['helpGrailConfidenceList50']}</li>
                        <li>${currentTranslations['helpGrailConfidenceList30']}</li>
                    </ul>
                </li>
                <li><strong>${currentTranslations['helpConfidenceResult']}</strong>
                    <p>${currentTranslations['helpConfidenceResultDesc1']}</p>
                    <ul>
                        <li>${currentTranslations['helpConfidenceResultListHighBuy']}</li>
                        <li>${currentTranslations['helpConfidenceResultListHighSell']}</li>
                        <li>${currentTranslations['helpConfidenceResultListMediumBuy']}</li>
                        <li>${currentTranslations['helpConfidenceResultListMediumSell']}</li>
                        <li>${currentTranslations['helpConfidenceResultListLow']}</li>
                    </ul>
                </li>
            </ul>

            <h3>${currentTranslations['helpHeatmapTitle']}</h3>
            <p>${currentTranslations['helpHeatmapDesc1']}</p>
            <ul>
                <li><span style="background-color: #00ff00; padding: 2px 5px; border-radius: 3px; color: #000;">${currentTranslations['helpHeatmapGreen']}</span></li>
                <li><span style="background-color: #ffff00; padding: 2px 5px; border-radius: 3px; color: #000;">${currentTranslations['helpHeatmapYellow']}</span></li>
                <li><span style="background-color: #ff0000; padding: 2px 5px; border-radius: 3px; color: #fff;">${currentTranslations['helpHeatmapRed']}</span></li>
            </ul>
            <p>${currentTranslations['helpHeatmapDesc2']}</p>
        `;
    }

    // Event listeners for the help modal
    helpInfoBtn.addEventListener('click', () => {
        populateHelpModalContent(); // Populate content before showing
        helpModal.style.display = 'flex'; // Use flex to center content
    });

    closeButton.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });

    // Close modal if user clicks outside of the modal content
    window.addEventListener('click', (event) => {
        if (event.target == helpModal) {
            helpModal.style.display = 'none';
        }
    });


    // --- Initial setup when DOM is fully loaded ---
    // Set initial language from localStorage or default
    languageSelect.value = currentLanguage;
    languageSelect.addEventListener('change', (event) => {
        updateLanguage(event.target.value);
    });

    // Initial language application
    updateLanguage(currentLanguage);


    const isCloudEnabledInitially = localStorage.getItem('cloudFeaturesEnabled') === 'true';
    if (enableCloudToggle) {
        enableCloudToggle.checked = isCloudEnabledInitially;
        enableCloudToggle.addEventListener('change', updateCloudButtonState);
    }

    if (isCloudEnabledInitially) {
        initializeFirebase();
    } else {
        document.getElementById('userIdDisplay').textContent = translations[currentLanguage]['userIdDisplayCloudDisabled'];
    }

    const savedPair = localStorage.getItem('selectedPair') || 'USDJPY';
    pairSelector.value = savedPair;
    showPairSection(savedPair);

    loadButtonStates();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    loadSimulationHistory();

    updateCloudButtonState();

    if (downloadHistoryBtn) {
        downloadHistoryBtn.addEventListener('click', downloadHistoryAsTextFile);
    }

    if (copyHistoryBtn) {
        copyHistoryBtn.addEventListener('click', () => {
            alert(translations[currentLanguage]['alertClipboardBlocked']);
        });
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm(translations[currentLanguage]['confirmClearHistory'])) {
                localStorage.removeItem('simulationHistory');
                renderSimulationHistory();
                alert(translations[currentLanguage]['alertHistoryCleared']);
            }
        });
    }

    if (loadDataLocalBtn) {
        loadDataLocalBtn.addEventListener('click', () => {
            loadFileInput.click();
        });
    }

    if (loadFileInput) {
        loadFileInput.addEventListener('change', loadDataFromFile);
    }

    if (saveDataLocalBtn) {
        saveDataLocalBtn.addEventListener('click', saveDataToFile);
    }

    if (saveDataCloudBtn) {
        saveDataCloudBtn.addEventListener('click', saveDataToCloud);
    }

    if (loadDataCloudBtn) {
        loadDataCloudBtn.addEventListener('click', loadDataFromCloud);
    }

    if (downloadHistoryHeatmapBtn) {
        downloadHistoryHeatmapBtn.addEventListener('click', downloadHistoryHeatmapsAsHtml);
    }
});
