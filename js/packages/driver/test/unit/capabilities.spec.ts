import {extractCapabilitiesEnvironment, extractCapabilitiesViewport} from '../../src/capabilities'
import assert from 'assert'

describe('capabilities', () => {
  it('should work with Chrome on Docker Container using W3C', () => {
    const capabilities = {
      acceptInsecureCerts: false,
      browserName: 'chrome',
      browserVersion: '94.0.4606.81',
      chrome: {
        chromedriverVersion: '94.0.4606.61 (418b78f5838ed0b1c69bb4e51ea0252171854915-refs/branch-heads/4606@{#1204})',
        userDataDir: '/tmp/.com.google.Chrome.9js3EO',
      },
      'goog:chromeOptions': {debuggerAddress: 'localhost:38739'},
      networkConnectionEnabled: false,
      pageLoadStrategy: 'normal',
      platformName: 'linux',
      proxy: {},
      'se:cdp': 'ws://172.17.0.2:4444/session/cd3ccb5a4635ca2bb992c2454fcb1a17/se/cdp',
      'se:cdpVersion': '94.0.4606.81',
      'se:vnc': 'ws://172.17.0.2:4444/session/cd3ccb5a4635ca2bb992c2454fcb1a17/se/vnc',
      'se:vncEnabled': true,
      'se:vncLocalAddress': 'ws://172.17.0.2:7900',
      setWindowRect: true,
      strictFileInteractability: false,
      timeouts: {implicit: 0, pageLoad: 300000, script: 30000},
      unhandledPromptBehavior: 'dismiss and notify',
      'webauthn:extension:credBlob': true,
      'webauthn:extension:largeBlob': true,
      'webauthn:virtualAuthenticators': true,
    }
    const environment = extractCapabilitiesEnvironment(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'chrome',
      browserVersion: '94.0.4606.81',
      platformName: 'linux',
      platformVersion: undefined,
      isW3C: true,
      isECClient: false,
      isMobile: false,
      isChrome: true,
    })
  })

  it('should work with IE on Windows using W3C in Sauce', () => {
    const capabilities = {
      browserVersion: '11',
      acceptInsecureCerts: false,
      'se:ieOptions': {
        'ie.browserCommandLineSwitches': '',
        browserAttachTimeout: 0,
        initialBrowserUrl: 'about:blank',
        'ie.ensureCleanSession': false,
        'ie.fileUploadDialogTimeout': 3000,
        ignoreProtectedModeSettings: false,
        requireWindowFocus: false,
        ignoreZoomSetting: false,
        nativeEvents: true,
        enablePersistentHover: true,
        elementScrollBehavior: 0,
        'ie.forceCreateProcessApi': false,
      },
      timeouts: {pageLoad: 300000, implicit: 0, script: 30000},
      browserName: 'internet explorer',
      'webdriver.remote.sessionid': '2be43cf0-3097-41af-9293-7449539e7762',
      proxy: {},
      pageLoadStrategy: 'normal',
      platformName: 'windows',
      setWindowRect: true,
    }
    const environment = extractCapabilitiesEnvironment(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'internet explorer',
      browserVersion: '11',
      platformName: 'windows',
      platformVersion: undefined,
      isW3C: true,
      isECClient: false,
      isMobile: false,
      isChrome: false,
    })
  })

  it('should work with Edge on Windows using W3C in Sauce', () => {
    const capabilities = {
      browserVersion: '95.0.1020.40',
      strictFileInteractability: false,
      acceptInsecureCerts: false,
      'webauthn:virtualAuthenticators': true,
      networkConnectionEnabled: false,
      timeouts: {pageLoad: 300000, implicit: 0, script: 30000},
      browserName: 'msedge',
      setWindowRect: true,
      'webauthn:extension:largeBlob': true,
      'webauthn:extension:credBlob': true,
      pageLoadStrategy: 'normal',
      'ms:edgeOptions': {debuggerAddress: 'localhost:56272'},
      platformName: 'windows',
      msedge: {
        msedgedriverVersion: '95.0.1020.40 (1f61f1c45c1e4229af88888771afd46a90ce2e88)',
        userDataDir: 'C:\\Users\\ADMINI~1\\AppData\\Local\\Temp\\scoped_dir3064_1128825602',
      },
      unhandledPromptBehavior: 'dismiss and notify',
      proxy: {},
    }
    const environment = extractCapabilitiesEnvironment(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'msedge',
      browserVersion: '95.0.1020.40',
      platformName: 'windows',
      platformVersion: undefined,
      isW3C: true,
      isECClient: false,
      isMobile: false,
      isChrome: false,
    })
  })

  it('should work with Edge on Windows using W3C in BS', () => {
    const capabilities = {
      acceptInsecureCerts: false,
      acceptSslCerts: false,
      applicationCacheEnabled: false,
      browserConnectionEnabled: false,
      browserName: 'msedge',
      cssSelectorsEnabled: true,
      databaseEnabled: false,
      handlesAlerts: true,
      hasTouchScreen: false,
      javascriptEnabled: true,
      locationContextEnabled: true,
      mobileEmulationEnabled: false,
      'ms:edgeOptions': {debuggerAddress: 'localhost:7571'},
      msedge: {
        msedgedriverVersion: '95.0.1020.30 (09f7018e2a65a55dea3a0a261efca40ae03471ed)',
        userDataDir: 'C:\\Windows\\proxy\\scoped_dir6696_726709977',
      },
      nativeEvents: true,
      networkConnectionEnabled: false,
      pageLoadStrategy: 'normal',
      platform: 'Windows',
      proxy: {},
      rotatable: false,
      setWindowRect: true,
      strictFileInteractability: false,
      takesHeapSnapshot: true,
      takesScreenshot: true,
      timeouts: {implicit: 0, pageLoad: 300000, script: 30000},
      unexpectedAlertBehaviour: 'ignore',
      version: '95.0.1020.30',
      webStorageEnabled: true,
      'webauthn:extension:credBlob': true,
      'webauthn:extension:largeBlob': true,
      'webauthn:virtualAuthenticators': true,
    }
    const environment = extractCapabilitiesEnvironment(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'msedge',
      browserVersion: '95.0.1020.30',
      platformName: 'Windows',
      platformVersion: undefined,
      isW3C: false,
      isECClient: false,
      isMobile: false,
      isChrome: false,
    })
  })

  it('should work with Chrome on Windows using W3C in Sauce', () => {
    const capabilities = {
      'goog:chromeOptions': {debuggerAddress: 'localhost:56767'},
      browserVersion: '95.0.4638.54',
      strictFileInteractability: false,
      timeouts: {pageLoad: 300000, implicit: 0, script: 30000},
      'webauthn:virtualAuthenticators': true,
      networkConnectionEnabled: false,
      acceptInsecureCerts: false,
      browserName: 'chrome',
      setWindowRect: true,
      proxy: {},
      'webauthn:extension:credBlob': true,
      pageLoadStrategy: 'normal',
      'webauthn:extension:largeBlob': true,
      platformName: 'windows',
      unhandledPromptBehavior: 'dismiss and notify',
      chrome: {
        chromedriverVersion: '95.0.4638.17 (a9d0719444d4b035e284ed1fce73bf6ccd789df2-refs/branch-heads/4638@{#178})',
        userDataDir: 'C:\\Users\\ADMINI~1\\AppData\\Local\\Temp\\scoped_dir2120_2132372376',
      },
    }
    const environment = extractCapabilitiesEnvironment(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'chrome',
      browserVersion: '95.0.4638.54',
      platformName: 'windows',
      platformVersion: undefined,
      isW3C: true,
      isECClient: false,
      isMobile: false,
      isChrome: true,
    })
  })

  it('should work with Chrome on Windows using W3C in BS', () => {
    const capabilities = {
      acceptInsecureCerts: false,
      browserName: 'chrome',
      browserVersion: '95.0.4638.54',
      chrome: {
        chromedriverVersion: '95.0.4638.17 (a9d0719444d4b035e284ed1fce73bf6ccd789df2-refs/branch-heads/4638@{#178})',
        userDataDir: 'C:\\Windows\\proxy\\scoped_dir4648_261332382',
      },
      'goog:chromeOptions': {debuggerAddress: 'localhost:5171'},
      networkConnectionEnabled: false,
      pageLoadStrategy: 'normal',
      platformName: 'windows',
      proxy: {},
      'se:cdpVersion': '95.0.4638.54',
      setWindowRect: true,
      strictFileInteractability: false,
      timeouts: {implicit: 0, pageLoad: 300000, script: 30000},
      unhandledPromptBehavior: 'dismiss and notify',
      'webauthn:extension:credBlob': true,
      'webauthn:extension:largeBlob': true,
      'webauthn:virtualAuthenticators': true,
    }
    const environment = extractCapabilitiesEnvironment(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'chrome',
      browserVersion: '95.0.4638.54',
      platformName: 'windows',
      platformVersion: undefined,
      isW3C: true,
      isECClient: false,
      isMobile: false,
      isChrome: true,
    })
  })

  it('should work with Firefox on Windows using W3C in Sauce', () => {
    const capabilities = {
      'moz:debuggerAddress': 'localhost:53228',
      'moz:headless': false,
      'moz:webdriverClick': true,
      'selenium:webdriver.remote.quietExceptions': false,
      strictFileInteractability: false,
      acceptInsecureCerts: false,
      'moz:profile': 'C:\\Users\\sauce\\AppData\\Local\\Temp\\rust_mozprofile3EhVXd',
      'webdriver.remote.sessionid': '0074349e-c7fb-4771-8269-69e0618680b0',
      'moz:useNonSpecCompliantPointerOrigin': false,
      platformName: 'windows',
      unhandledPromptBehavior: 'dismiss and notify',
      'moz:accessibilityChecks': false,
      browserName: 'firefox',
      proxy: {},
      platformVersion: '10.0',
      'moz:processID': 5608,
      'moz:shutdownTimeout': 60000,
      browserVersion: '94.0',
      timeouts: {pageLoad: 300000, implicit: 0, script: 30000},
      'moz:geckodriverVersion': '0.30.0',
      setWindowRect: true,
      'moz:buildID': '20211028161635',
      pageLoadStrategy: 'normal',
    }
    const environment = extractCapabilitiesEnvironment(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'firefox',
      browserVersion: '94.0',
      platformName: 'windows',
      platformVersion: '10.0',
      isW3C: true,
      isECClient: false,
      isMobile: false,
      isChrome: false,
    })
  })

  it('should work with Firefox on Windows using W3C in BS', () => {
    const capabilities = {
      'moz:profile': 'C:\\Windows\\proxy\\rust_mozprofile5IWctq',
      'moz:geckodriverVersion': '0.30.0',
      timeouts: {implicit: 0, pageLoad: 300000, script: 30000},
      pageLoadStrategy: 'normal',
      unhandledPromptBehavior: 'dismiss and notify',
      strictFileInteractability: false,
      'moz:headless': false,
      proxy: {},
      'moz:accessibilityChecks': false,
      'moz:useNonSpecCompliantPointerOrigin': false,
      acceptInsecureCerts: false,
      browserVersion: '94.0',
      'moz:shutdownTimeout': 60000,
      platformVersion: '10.0',
      'moz:processID': 6252,
      browserName: 'firefox',
      'moz:buildID': '20211028161635',
      platformName: 'windows',
      setWindowRect: true,
      'moz:webdriverClick': true,
      'webdriver.remote.sessionid': 'f567079469e4ab139ded2bd56bb71a041b850bed',
    }
    const environment = extractCapabilitiesEnvironment(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'firefox',
      browserVersion: '94.0',
      platformName: 'windows',
      platformVersion: '10.0',
      isW3C: true,
      isECClient: false,
      isMobile: false,
      isChrome: false,
    })
  })

  it('should work with Safari on MacOS using W3C in Sauce', () => {
    const capabilities = {
      browserVersion: '14.1',
      'safari:platformVersion': '11.3.1',
      'safari:diagnose': false,
      strictFileInteractability: false,
      'safari:automaticInspection': false,
      acceptInsecureCerts: false,
      'safari:platformBuildVersion': '20E241',
      'safari:automaticProfiling': false,
      'selenium:webdriver.remote.quietExceptions': false,
      browserName: 'Safari',
      'webdriver.remote.sessionid': 'D1EC8E47-970A-4099-8564-90F879D115D0',
      'webkit:WebRTC': {
        DisableICECandidateFiltering: false,
        DisableInsecureMediaCapture: false,
      },
      'safari:useSimulator': false,
      'apple:safari.options': {},
      platformName: 'macOS',
      setWindowRect: true,
    }
    const environment = extractCapabilitiesEnvironment(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: '14.1',
      platformName: 'macOS',
      platformVersion: undefined,
      isW3C: true,
      isECClient: false,
      isMobile: false,
      isChrome: false,
    })
  })

  it('should work with Safari on MacOS using W3C in BS', () => {
    const capabilities = {
      'safari:platformVersion': '11.5.2',
      'safari:automaticInspection': false,
      'webkit:WebRTC': {
        DisableICECandidateFiltering: false,
        DisableInsecureMediaCapture: false,
      },
      browserVersion: '14.1.2',
      strictFileInteractability: false,
      browserName: 'Safari',
      'safari:useSimulator': false,
      'safari:automaticProfiling': false,
      'safari:platformBuildVersion': '20G95',
      acceptInsecureCerts: false,
      setWindowRect: true,
      platformName: 'macOS',
      'safari:diagnose': false,
      'webdriver.remote.sessionid': 'a159db85d5ec159a37e5a890d8a67a5a650a48fc',
    }
    const environment = extractCapabilitiesEnvironment(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: '14.1.2',
      platformName: 'macOS',
      platformVersion: undefined,
      isW3C: true,
      isECClient: false,
      isMobile: false,
      isChrome: false,
    })
  })

  it('should work with Chrome on MacOS using W3C in Sauce', () => {
    const capabilities = {
      'goog:chromeOptions': {debuggerAddress: 'localhost:49196'},
      browserVersion: '95.0.4638.54',
      strictFileInteractability: false,
      timeouts: {pageLoad: 300000, implicit: 0, script: 30000},
      'webauthn:virtualAuthenticators': true,
      networkConnectionEnabled: false,
      acceptInsecureCerts: false,
      browserName: 'chrome',
      setWindowRect: true,
      proxy: {},
      'webauthn:extension:credBlob': true,
      pageLoadStrategy: 'normal',
      'webauthn:extension:largeBlob': true,
      platformName: 'mac os x',
      unhandledPromptBehavior: 'dismiss and notify',
      chrome: {
        chromedriverVersion: '95.0.4638.17 (a9d0719444d4b035e284ed1fce73bf6ccd789df2-refs/branch-heads/4638@{#178})',
        userDataDir: '/var/folders/dv/14mq8zpj3yx7cgtrwhjp77_h0000kr/T/.com.google.Chrome.XX9zps',
      },
    }
    const environment = extractCapabilitiesEnvironment(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'chrome',
      browserVersion: '95.0.4638.54',
      platformName: 'mac os x',
      platformVersion: undefined,
      isW3C: true,
      isECClient: false,
      isMobile: false,
      isChrome: true,
    })
  })

  it('should work with Chrome on MacOS using W3C in BS', () => {
    const capabilities = {
      acceptInsecureCerts: false,
      browserName: 'chrome',
      browserVersion: '95.0.4638.54',
      chrome: {
        chromedriverVersion: '95.0.4638.17 (a9d0719444d4b035e284ed1fce73bf6ccd789df2-refs/branch-heads/4638@{#178})',
        userDataDir: '/var/folders/3y/zz_w6_s56sl__vcrf3r5bhzr0000hr/T/.com.google.Chrome.Lj8cKL',
      },
      'goog:chromeOptions': {debuggerAddress: 'localhost:53464'},
      networkConnectionEnabled: false,
      pageLoadStrategy: 'normal',
      platformName: 'mac os x',
      proxy: {},
      setWindowRect: true,
      strictFileInteractability: false,
      timeouts: {implicit: 0, pageLoad: 300000, script: 30000},
      unhandledPromptBehavior: 'dismiss and notify',
      'webauthn:extension:credBlob': true,
      'webauthn:extension:largeBlob': true,
      'webauthn:virtualAuthenticators': true,
      'webdriver.remote.sessionid': '6eab542091a9da8e813ae63860b49cad99a6a1a4',
    }
    const environment = extractCapabilitiesEnvironment(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'chrome',
      browserVersion: '95.0.4638.54',
      platformName: 'mac os x',
      platformVersion: undefined,
      isW3C: true,
      isECClient: false,
      isMobile: false,
      isChrome: true,
    })
  })

  it('should work with Firefox on MacOS using W3C in Sauce', () => {
    const capabilities = {
      'moz:debuggerAddress': 'localhost:53485',
      'moz:headless': false,
      'moz:webdriverClick': true,
      'selenium:webdriver.remote.quietExceptions': false,
      strictFileInteractability: false,
      acceptInsecureCerts: false,
      'moz:profile': '/var/folders/dv/14mq8zpj3yx7cgtrwhjp77_h0000kr/T/rust_mozprofileVBgdHy',
      'webdriver.remote.sessionid': '9f43275e-bf85-6f4e-9604-28a82ef9c4c3',
      'moz:useNonSpecCompliantPointerOrigin': false,
      platformName: 'mac',
      unhandledPromptBehavior: 'dismiss and notify',
      'moz:accessibilityChecks': false,
      browserName: 'firefox',
      proxy: {},
      platformVersion: '20.4.0',
      'moz:processID': 3105,
      'moz:shutdownTimeout': 60000,
      browserVersion: '94.0',
      timeouts: {pageLoad: 300000, implicit: 0, script: 30000},
      'moz:geckodriverVersion': '0.30.0',
      setWindowRect: true,
      'moz:buildID': '20211028161635',
      pageLoadStrategy: 'normal',
    }
    const environment = extractCapabilitiesEnvironment(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'firefox',
      browserVersion: '94.0',
      platformName: 'mac',
      platformVersion: '20.4.0',
      isW3C: true,
      isECClient: false,
      isMobile: false,
      isChrome: false,
    })
  })

  it('should work with Firefox on MacOS using W3C in BS', () => {
    const capabilities = {
      'moz:profile': '/var/folders/3y/zz_w6_s56sl__vcrf3r5bhzr0000hr/T/rust_mozprofilecBCOgP',
      'moz:geckodriverVersion': '0.30.0',
      timeouts: {implicit: 0, pageLoad: 300000, script: 30000},
      pageLoadStrategy: 'normal',
      unhandledPromptBehavior: 'dismiss and notify',
      strictFileInteractability: false,
      'moz:headless': false,
      proxy: {},
      'moz:accessibilityChecks': false,
      'moz:useNonSpecCompliantPointerOrigin': false,
      acceptInsecureCerts: false,
      browserVersion: '94.0',
      'moz:shutdownTimeout': 60000,
      platformVersion: '20.6.0',
      'moz:processID': 18587,
      browserName: 'firefox',
      'moz:buildID': '20211028161635',
      platformName: 'mac',
      setWindowRect: true,
      'moz:webdriverClick': true,
      'webdriver.remote.sessionid': 'cde12c32081c4349a3e3ba72b32841ec0bfc7a5c',
    }
    const environment = extractCapabilitiesEnvironment(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'firefox',
      browserVersion: '94.0',
      platformName: 'mac',
      platformVersion: '20.6.0',
      isW3C: true,
      isECClient: false,
      isMobile: false,
      isChrome: false,
    })
  })

  it('should work with Safari on iPhone 13 using Appium 1.22 in Sauce', () => {
    const capabilities = {
      deviceName: 'iPhone 13',
      orientation: 'PORTRAIT',
      noReset: true,
      'selenium:webdriver.remote.quietExceptions': false,
      CFBundleIdentifier: 'com.apple.mobilesafari',
      platformVersion: '15.0',
      bootstrapPath: '/Volumes/Sauce/wda/wda-v1.22.0-xcode12.4/WebDriverAgent',
      newCommandTimeout: 0,
      preventWDAAttachments: true,
      'sauce:options': {},
      viewportRect: {width: 1170, top: 141, height: 2391, left: 0},
      derivedDataPath: '/Volumes/Sauce/wda/wda-v1.22.0-xcode12.4/WebDriverAgent/DerivedData/WebdriverAgent',
      'webdriver.remote.sessionid': '806f87f9836b4d54b4dea81586680d64',
      maxTypingFrequency: 8,
      platformName: 'iOS',
      events: {
        xcodeDetailsRetrieved: [1636646934921],
        orientationSet: [1636646987464],
        commands: [],
        initialWebviewNavigated: [1636646992884],
        wdaStarted: [1636646986585],
        resetComplete: [1636646934922],
        appConfigured: [1636646934922],
        logCaptureStarted: [1636646963793],
        wdaSessionStarted: [1636646986585],
        wdaSessionAttempted: [1636646981122],
        simStarted: [1636646962575],
        wdaStartAttempted: [1636646963957],
        resetStarted: [1636646934922],
      },
      pixelRatio: 3,
      showIOSLog: false,
      usePrebuiltWDA: true,
      browserName: 'Safari',
      hasMetadata: true,
      device: 'iphone',
      eventTimings: true,
      keepKeyChains: true,
      sdkVersion: '15.0',
      launchTimeout: 180000,
      udid: '53BA11E8-98DB-436B-8E48-1B406FA28B66',
      statBarHeight: 47,
      backendRetries: 4,
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '15.0',
      deviceName: 'iPhone 13',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: false,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })

    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: 3,
      statusBarSize: 47,
    })
  })

  it('should work with Safari on iPhone 12 using Appium 1.22 in BS', () => {
    const capabilities = {
      udid: '00008101-001828A93491003A',
      platformName: 'iOS',
      browserName: 'Safari',
      newCommandTimeout: 0,
      realMobile: 'true',
      deviceName: 'iPhone 12',
      safariIgnoreFraudWarning: true,
      orientation: 'PORTRAIT',
      deviceOrientation: 'PORTRAIT',
      noReset: true,
      keychainPath: '[REDACTED VALUE]',
      keychainPassword: '[REDACTED VALUE]',
      platformVersion: '14.1',
      useXctestrunFile: true,
      bootstrapPath: '/usr/local/.browserstack/config/wda_derived_data_00008101-001828A93491003A_1.22.0/Build/Products',
      'browserstack.isTargetBased': 'true',
      device: 'iphone',
      sdkVersion: '14.1',
      CFBundleIdentifier: 'com.apple.mobilesafari',
      pixelRatio: 3,
      statBarHeight: 47,
      viewportRect: {left: 0, top: 141, width: 1170, height: 2391},
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '14.1',
      deviceName: 'iPhone 12',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: false,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: 3,
      statusBarSize: 47,
    })
  })

  it('should work with Safari on iPhone 12 using Appium 1.20 in Sauce', () => {
    const capabilities = {
      deviceName: 'iPhone 12',
      orientation: 'PORTRAIT',
      noReset: true,
      'selenium:webdriver.remote.quietExceptions': false,
      CFBundleIdentifier: 'com.apple.mobilesafari',
      platformVersion: '14.5',
      bootstrapPath: '/Volumes/Sauce/wda/wda-v1.20.0-xcode12.5/WebDriverAgent',
      newCommandTimeout: 0,
      preventWDAAttachments: true,
      'sauce:options': {},
      viewportRect: {width: 1170, top: 141, height: 2391, left: 0},
      derivedDataPath: '/Volumes/Sauce/wda/wda-v1.20.0-xcode12.5/WebDriverAgent/DerivedData/WebdriverAgent',
      'webdriver.remote.sessionid': 'adfc56d030cb4565b4a7a00633982dbe',
      maxTypingFrequency: 8,
      platformName: 'iOS',
      events: {
        xcodeDetailsRetrieved: [1636647932390],
        orientationSet: [1636647982875],
        commands: [],
        initialWebviewNavigated: [1636647988261],
        wdaStarted: [1636647982254],
        resetComplete: [1636647932392],
        appConfigured: [1636647932391],
        logCaptureStarted: [1636647962599],
        wdaSessionStarted: [1636647982253],
        wdaSessionAttempted: [1636647978364],
        simStarted: [1636647960952],
        wdaStartAttempted: [1636647962727],
        resetStarted: [1636647932391],
      },
      pixelRatio: 3,
      showIOSLog: false,
      usePrebuiltWDA: true,
      browserName: 'Safari',
      hasMetadata: true,
      device: 'iphone',
      eventTimings: true,
      keepKeyChains: true,
      sdkVersion: '14.5',
      launchTimeout: 180000,
      udid: 'A60722D7-43E3-4118-BDAE-E825BE9C1550',
      statBarHeight: 47,
      backendRetries: 4,
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '14.5',
      deviceName: 'iPhone 12',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: false,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: 3,
      statusBarSize: 47,
    })
  })

  it('should work with Safari on iPhone 12 using Appium 1.20 in BS', () => {
    const capabilities = {
      udid: '00008101-001C50D404E1401E',
      platformName: 'iOS',
      browserName: 'Safari',
      newCommandTimeout: 0,
      realMobile: 'true',
      deviceName: 'iPhone 12',
      safariIgnoreFraudWarning: true,
      orientation: 'PORTRAIT',
      deviceOrientation: 'PORTRAIT',
      noReset: true,
      keychainPath: '[REDACTED VALUE]',
      keychainPassword: '[REDACTED VALUE]',
      platformVersion: '14.1',
      useXctestrunFile: true,
      bootstrapPath: '/usr/local/.browserstack/config/wda_derived_data_00008101-001C50D404E1401E_1.20.2/Build/Products',
      'browserstack.isTargetBased': 'true',
      device: 'iphone',
      sdkVersion: '14.1',
      CFBundleIdentifier: 'com.apple.mobilesafari',
      pixelRatio: 3,
      statBarHeight: 47,
      viewportRect: {left: 0, top: 141, width: 1170, height: 2391},
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '14.1',
      deviceName: 'iPhone 12',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: false,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: 3,
      statusBarSize: 47,
    })
  })

  it('should work with Safari on iPhone 11 using Appium 1.15 in Sauce', () => {
    const capabilities = {
      deviceName: 'iPhone 11',
      orientation: 'PORTRAIT',
      noReset: true,
      'selenium:webdriver.remote.quietExceptions': false,
      CFBundleIdentifier: 'com.apple.mobilesafari',
      platformVersion: '13.0',
      bootstrapPath: '/Volumes/Sauce/wda/wda-v1.15.0-xcode11.2.1',
      newCommandTimeout: 0,
      preventWDAAttachments: true,
      'sauce:options': {},
      viewportRect: {width: 828, top: 0, height: 1792, left: 0},
      derivedDataPath: '/Volumes/Sauce/wda/wda-v1.15.0-xcode11.2.1/DerivedData/WebdriverAgent',
      'webdriver.remote.sessionid': 'e7db7f2c045043a9af659c2c0bf5cdbb',
      maxTypingFrequency: 8,
      platformName: 'iOS',
      events: {
        xcodeDetailsRetrieved: [1636648639851],
        orientationSet: [1636648706796],
        commands: [],
        initialWebviewNavigated: [1636648714317],
        wdaStarted: [1636648705011],
        resetComplete: [1636648639854],
        appConfigured: [1636648639852],
        logCaptureStarted: [1636648671340],
        wdaSessionStarted: [1636648705011],
        wdaSessionAttempted: [1636648694323],
        simStarted: [1636648670144],
        wdaStartAttempted: [1636648671563],
        resetStarted: [1636648639853],
      },
      pixelRatio: 2,
      showIOSLog: false,
      usePrebuiltWDA: true,
      browserName: 'Safari',
      hasMetadata: true,
      device: 'iphone',
      eventTimings: true,
      keepKeyChains: true,
      sdkVersion: '13.0',
      launchTimeout: 180000,
      udid: '8B21B469-14C3-4427-BB7A-37237415BD14',
      statBarHeight: 0,
      backendRetries: 4,
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '13.0',
      deviceName: 'iPhone 11',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: false,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: 2,
      statusBarSize: 0,
    })
  })

  it('should work with Safari on iPhone 11 using Appium 1.14 in BS', () => {
    const capabilities = {
      udid: '00008030-001251E20C01802E',
      keychainPath: '[REDACTED VALUE]',
      keychainPassword: '[REDACTED VALUE]',
      platformVersion: '12.2',
      useXctestrunFile: true,
      bootstrapPath: '/usr/local/.browserstack/config/wda_derived_data_00008030-001251E20C01802E_1.14.0/Build/Products',
      orientation: 'PORTRAIT',
      'browserstack.isTargetBased': 'true',
      newCommandTimeout: 0,
      browserName: 'Safari',
      options: {
        osVersion: '13',
        deviceName: 'iPhone 11',
        realMobile: true,
        appiumVersion: '1.14.0',
        local: false,
      },
      'browserstack.is_hub_canary': 'false',
      acceptSslCert: false,
      detected_language: 'webdriver/7.14.1',
      new_bucketing: true,
      browser: 'iphone',
      osVersion: '13',
      deviceName: 'iPhone 11',
      real_mobile: 'true',
      'browserstack-tunnel': 'false',
      os_version: '13.0',
      browser_name: 'iPhone',
      device: 'iphone',
      platform: 'MAC',
      version: '',
      mobile: {browser: 'mobile', version: 'iPhone 11-13.3'},
      orig_os: 'ios',
      '64bit': false,
      automationName: 'XCUITest',
      safariInitialUrl: 'http://mobile-internet-check.browserstack.com',
      webkitResponseTimeout: 20000,
      deviceOrientation: 'PORTRAIT',
      'browserstack.appium_version': '1.14.0',
      realMobile: 'true',
      acceptSslCerts: false,
      platformName: 'iOS',
      safariIgnoreFraudWarning: true,
      noReset: true,
      wda_port: 8408,
      sdkVersion: '13.3',
      CFBundleIdentifier: 'com.apple.mobilesafari',
      pixelRatio: 2,
      statBarHeight: 0,
      viewportRect: {left: 0, top: 0, width: 828, height: 1792},
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '12.2',
      deviceName: 'iPhone 11',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: false,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: 2,
      statusBarSize: 0,
    })
  })

  it('should work with Safari on iPhone X using Appium 1.9 in Sauce', () => {
    const capabilities = {
      deviceName: 'iPhone X',
      orientation: 'PORTRAIT',
      noReset: true,
      'selenium:webdriver.remote.quietExceptions': false,
      CFBundleIdentifier: 'com.apple.mobilesafari',
      platformVersion: '12.0',
      bootstrapPath: '/Volumes/Sauce/wda/wda-v1.9.1-xcode10/WebdriverAgent',
      newCommandTimeout: 0,
      preventWDAAttachments: true,
      'sauce:options': {},
      viewportRect: {width: 2940, top: 132, height: 4845, left: 0},
      derivedDataPath: '/Volumes/Sauce/wda/wda-v1.9.1-xcode10/WebdriverAgent/DerivedData/WebdriverAgent',
      'webdriver.remote.sessionid': '7252cce7f2e345ca961d5395875007c3',
      maxTypingFrequency: 8,
      platformName: 'iOS',
      events: {
        xcodeDetailsRetrieved: [1636649010968],
        wdaPermsAdjusted: [1636649066675],
        commands: [],
        initialWebviewNavigated: [1636649071172],
        wdaStarted: [1636649066676],
        resetComplete: [1636649012135],
        orientationSet: [1636649068261],
        appConfigured: [1636649012131],
        logCaptureStarted: [1636649045541],
        wdaSessionStarted: [1636649066672],
        wdaSessionAttempted: [1636649061928],
        simStarted: [1636649044254],
        wdaStartAttempted: [1636649045694],
        resetStarted: [1636649012132],
      },
      pixelRatio: 3,
      showIOSLog: false,
      usePrebuiltWDA: true,
      browserName: 'Safari',
      hasMetadata: true,
      device: 'iphone',
      eventTimings: true,
      keepKeyChains: true,
      sdkVersion: '12.0',
      launchTimeout: 180000,
      udid: '83165112-F730-48A8-A3AE-D205019A2269',
      statBarHeight: 44,
      backendRetries: 4,
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '12.0',
      deviceName: 'iPhone X',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: false,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: 3,
      statusBarSize: 44,
    })
  })

  it('should work with Safari on iPhone X using Appium 1.7 in BS', () => {
    const capabilities = {
      udid: 'b4a2ae5fecb8903d0d4da2ca0bfc80d3a939fde9',
      keychainPath: '[REDACTED VALUE]',
      keychainPassword: '[REDACTED VALUE]',
      platformVersion: '11.0',
      useXctestrunFile: true,
      bootstrapPath:
        '/usr/local/.browserstack/config/wda_derived_data_b4a2ae5fecb8903d0d4da2ca0bfc80d3a939fde9_1.14.0/Build/Products',
      orientation: 'PORTRAIT',
      'browserstack.isTargetBased': 'false',
      newCommandTimeout: 0,
      browserName: 'Safari',
      options: {
        osVersion: '11',
        deviceName: 'iPhone X',
        realMobile: true,
        local: false,
      },
      'browserstack.is_hub_canary': 'false',
      acceptSslCert: false,
      detected_language: 'webdriver/7.14.1',
      new_bucketing: true,
      browser: 'iphone',
      osVersion: '11',
      deviceName: 'iPhone X',
      real_mobile: 'true',
      'browserstack-tunnel': 'false',
      os_version: '11.0',
      browser_name: 'iPhone',
      device: 'iphone',
      platform: 'MAC',
      version: '',
      mobile: {browser: 'mobile', version: 'iPhone X-11.2'},
      orig_os: 'ios',
      '64bit': false,
      automationName: 'XCUITest',
      safariInitialUrl: 'http://mobile-internet-check.browserstack.com',
      webkitResponseTimeout: 20000,
      deviceOrientation: 'PORTRAIT',
      'browserstack.appium_version': '1.14.0',
      'browserstack.appiumVersion': '1.14.0',
      realMobile: 'true',
      acceptSslCerts: false,
      platformName: 'iOS',
      safariIgnoreFraudWarning: true,
      noReset: true,
      wda_port: 8403,
      sdkVersion: '11.2',
      CFBundleIdentifier: 'com.apple.mobilesafari',
      pixelRatio: 2,
      statBarHeight: 44,
      viewportRect: {left: 0, top: 88, width: 1960, height: 3258},
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '11.0',
      deviceName: 'iPhone X',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: false,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: 2,
      statusBarSize: 44,
    })
  })

  it('should work with Safari on iPhone 8 using Appium 1.8 in Sauce', () => {
    const capabilities = {
      deviceName: 'iPhone 8',
      orientation: 'PORTRAIT',
      noReset: true,
      'selenium:webdriver.remote.quietExceptions': false,
      CFBundleIdentifier: 'com.apple.mobilesafari',
      platformVersion: '11.0',
      newCommandTimeout: 0,
      preventWDAAttachments: true,
      'sauce:options': {},
      viewportRect: {width: 1960, top: 40, height: 2850, left: 0},
      'webdriver.remote.sessionid': '1b9783f5f8754c6ea6925701e358a282',
      maxTypingFrequency: 8,
      platformName: 'iOS',
      events: {
        xcodeDetailsRetrieved: [1636649243953],
        wdaPermsAdjusted: [1636649299499],
        commands: [],
        initialWebviewNavigated: [1636649300934],
        wdaStarted: [1636649299499],
        resetComplete: [1636649244245],
        orientationSet: [1636649300568],
        appConfigured: [1636649244243],
        logCaptureStarted: [1636649260091],
        wdaSessionStarted: [1636649299313],
        wdaSessionAttempted: [1636649295801],
        simStarted: [1636649259273],
        wdaStartAttempted: [1636649260468],
        resetStarted: [1636649244244],
      },
      pixelRatio: 2,
      showIOSLog: false,
      browserName: 'Safari',
      hasMetadata: true,
      device: 'iphone',
      eventTimings: true,
      keepKeyChains: true,
      sdkVersion: '11.0.1',
      launchTimeout: 180000,
      udid: '4DAF25B3-6C7A-411E-A94B-C3FDB1CDFF57',
      statBarHeight: 20,
      backendRetries: 4,
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '11.0',
      deviceName: 'iPhone 8',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: false,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: 2,
      statusBarSize: 20,
    })
  })

  it('should work with Safari on iPhone 7 using Appium 1.7 in BS', () => {
    const capabilities = {
      udid: '13c148928a0125464f64df9e9b339c12c9e709f6',
      keychainPath: '[REDACTED VALUE]',
      keychainPassword: '[REDACTED VALUE]',
      platformVersion: '11.0',
      useXctestrunFile: true,
      bootstrapPath:
        '/usr/local/.browserstack/config/wda_derived_data_13c148928a0125464f64df9e9b339c12c9e709f6_1.14.0/Build/Products',
      orientation: 'PORTRAIT',
      'browserstack.isTargetBased': 'false',
      newCommandTimeout: 0,
      browserName: 'Safari',
      options: {
        osVersion: '10',
        deviceName: 'iPhone 7',
        realMobile: true,
        local: false,
      },
      'browserstack.is_hub_canary': 'false',
      acceptSslCert: false,
      detected_language: 'webdriver/7.14.1',
      new_bucketing: true,
      browser: 'iphone',
      osVersion: '10',
      deviceName: 'iPhone 7',
      real_mobile: 'true',
      'browserstack-tunnel': 'false',
      os_version: '10.0',
      browser_name: 'iPhone',
      device: 'iphone',
      platform: 'MAC',
      version: '',
      mobile: {browser: 'mobile', version: 'iPhone 7-10.3'},
      orig_os: 'ios',
      '64bit': false,
      automationName: 'XCUITest',
      safariInitialUrl: 'http://mobile-internet-check.browserstack.com',
      webkitResponseTimeout: 20000,
      deviceOrientation: 'PORTRAIT',
      'browserstack.appium_version': '1.14.0',
      'browserstack.appiumVersion': '1.14.0',
      realMobile: 'true',
      acceptSslCerts: false,
      platformName: 'iOS',
      safariIgnoreFraudWarning: true,
      noReset: true,
      wda_port: 8400,
      sdkVersion: '10.3.2',
      CFBundleIdentifier: 'com.apple.mobilesafari',
      pixelRatio: 2,
      statBarHeight: 20,
      viewportRect: {left: 0, top: 40, width: 1960, height: 2882},
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '11.0',
      deviceName: 'iPhone 7',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: false,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: 2,
      statusBarSize: 20,
    })
  })

  it('should work with Safari on iPad 8th using Appium 1.22 in BS', () => {
    const capabilities = {
      udid: '00008020-000D75E23493802E',
      platformName: 'iOS',
      browserName: 'Safari',
      newCommandTimeout: 0,
      realMobile: 'true',
      deviceName: 'iPad 8th',
      safariIgnoreFraudWarning: true,
      orientation: 'PORTRAIT',
      deviceOrientation: 'PORTRAIT',
      noReset: true,
      keychainPath: '[REDACTED VALUE]',
      keychainPassword: '[REDACTED VALUE]',
      platformVersion: '14.1',
      useXctestrunFile: true,
      bootstrapPath: '/usr/local/.browserstack/config/wda_derived_data_00008020-000D75E23493802E_1.22.0/Build/Products',
      'browserstack.isTargetBased': 'true',
      device: 'ipad',
      sdkVersion: '14.0',
      CFBundleIdentifier: 'com.apple.mobilesafari',
      pixelRatio: 2,
      statBarHeight: 20,
      viewportRect: {left: 0, top: 40, width: 1620, height: 2120},
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '14.1',
      deviceName: 'iPad 8th',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: false,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: 2,
      statusBarSize: 20,
    })
  })

  it('should work with Safari on iPad 7th using Appium 1.19 in BS', () => {
    const capabilities = {
      udid: '1fe9724b13ca72810daf46b72afedc1f0dd54a9e',
      platformName: 'iOS',
      browserName: 'Safari',
      newCommandTimeout: 0,
      realMobile: 'true',
      deviceName: 'iPad 7th',
      safariIgnoreFraudWarning: true,
      orientation: 'PORTRAIT',
      deviceOrientation: 'PORTRAIT',
      noReset: true,
      keychainPath: '[REDACTED VALUE]',
      keychainPassword: '[REDACTED VALUE]',
      platformVersion: '14.1',
      useXctestrunFile: true,
      bootstrapPath:
        '/usr/local/.browserstack/config/wda_derived_data_1fe9724b13ca72810daf46b72afedc1f0dd54a9e_1.19.1/Build/Products',
      'browserstack.isTargetBased': 'true',
      device: 'ipad',
      sdkVersion: '13.4.1',
      CFBundleIdentifier: 'com.apple.mobilesafari',
      pixelRatio: 2,
      statBarHeight: 20,
      viewportRect: {left: 0, top: 40, width: 1620, height: 2120},
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '14.1',
      deviceName: 'iPad 7th',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: false,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: 2,
      statusBarSize: 20,
    })
  })

  it('should work with Safari on iPad 6th using Appium 1.12 in BS', () => {
    const capabilities = {
      udid: 'd7610d95d99d9ff6b6d97f71c032a0799daec55d',
      keychainPath: '[REDACTED VALUE]',
      keychainPassword: '[REDACTED VALUE]',
      platformVersion: '11.0',
      useXctestrunFile: true,
      bootstrapPath:
        '/usr/local/.browserstack/config/wda_derived_data_d7610d95d99d9ff6b6d97f71c032a0799daec55d_1.12.1/Build/Products',
      orientation: 'PORTRAIT',
      'browserstack.isTargetBased': 'false',
      newCommandTimeout: 0,
      browserName: 'Safari',
      options: {
        osVersion: '11',
        deviceName: 'iPad 6th',
        realMobile: true,
        appiumVersion: '1.12.1',
        local: false,
      },
      'browserstack.is_hub_canary': 'false',
      acceptSslCert: false,
      detected_language: 'webdriver/7.14.1',
      new_bucketing: true,
      browser: 'ipad',
      osVersion: '11',
      deviceName: 'iPad 6th',
      real_mobile: 'true',
      'browserstack-tunnel': 'false',
      os_version: '11.0',
      browser_name: 'iPad',
      device: 'ipad',
      platform: 'MAC',
      version: '',
      mobile: {browser: 'tablet', version: 'iPad 6th-11.3'},
      orig_os: 'ios',
      '64bit': false,
      automationName: 'XCUITest',
      safariInitialUrl: 'http://mobile-internet-check.browserstack.com',
      webkitResponseTimeout: 20000,
      deviceOrientation: 'PORTRAIT',
      'browserstack.appium_version': '1.12.1',
      realMobile: 'true',
      acceptSslCerts: false,
      platformName: 'iOS',
      safariIgnoreFraudWarning: true,
      noReset: true,
      wda_port: 8404,
      sdkVersion: '11.3',
      CFBundleIdentifier: 'com.apple.mobilesafari',
      pixelRatio: 2,
      statBarHeight: 20,
      viewportRect: {left: 0, top: 40, width: 1960, height: 2394},
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '11.0',
      deviceName: 'iPad 6th',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: false,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: 2,
      statusBarSize: 20,
    })
  })

  it('should work with Safari on iPad 5th using Appium 1.7 in BS', () => {
    const capabilities = {
      udid: '73b681dedf50e5a3df3ea4c0e0bc87641bd177b2',
      keychainPath: '[REDACTED VALUE]',
      keychainPassword: '[REDACTED VALUE]',
      platformVersion: '11.0',
      useXctestrunFile: true,
      bootstrapPath:
        '/usr/local/.browserstack/config/wda_derived_data_73b681dedf50e5a3df3ea4c0e0bc87641bd177b2_1.14.0/Build/Products',
      orientation: 'PORTRAIT',
      'browserstack.isTargetBased': 'false',
      newCommandTimeout: 0,
      browserName: 'Safari',
      options: {
        osVersion: '11',
        deviceName: 'iPad 5th',
        realMobile: true,
        local: false,
      },
      'browserstack.is_hub_canary': 'false',
      acceptSslCert: false,
      detected_language: 'webdriver/7.14.1',
      new_bucketing: true,
      browser: 'ipad',
      osVersion: '11',
      deviceName: 'iPad 5th',
      real_mobile: 'true',
      'browserstack-tunnel': 'false',
      os_version: '11.0',
      browser_name: 'iPad',
      device: 'ipad',
      platform: 'MAC',
      version: '',
      mobile: {browser: 'tablet', version: 'iPad 5th-11.2'},
      orig_os: 'ios',
      '64bit': false,
      automationName: 'XCUITest',
      safariInitialUrl: 'http://mobile-internet-check.browserstack.com',
      webkitResponseTimeout: 20000,
      deviceOrientation: 'PORTRAIT',
      'browserstack.appium_version': '1.14.0',
      'browserstack.appiumVersion': '1.14.0',
      realMobile: 'true',
      acceptSslCerts: false,
      platformName: 'iOS',
      safariIgnoreFraudWarning: true,
      noReset: true,
      wda_port: 8407,
      sdkVersion: '11.2',
      CFBundleIdentifier: 'com.apple.mobilesafari',
      pixelRatio: 2,
      statBarHeight: 20,
      viewportRect: {left: 0, top: 40, width: 1960, height: 2394},
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: 'Safari',
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '11.0',
      deviceName: 'iPad 5th',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: false,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: 2,
      statusBarSize: 20,
    })
  })

  it('should work with Native App on iPhone 11 Pro using Appium 1.19 in Sauce', () => {
    const capabilities = {
      deviceName: 'iPhone 11 Pro',
      takesScreenshot: true,
      orientation: 'PORTRAIT',
      app: '/var/folders/qv/8dr6ylkn3c98dm4r414wh_0h0000kr/T/tmpn4dcUp/IOSTestApp-1.5.zip',
      networkConnectionEnabled: false,
      bootstrapPath: '/Volumes/Sauce/wda/wda-v1.19.1-xcode12.2/WebDriverAgent',
      newCommandTimeout: 0,
      preventWDAAttachments: true,
      derivedDataPath: '/Volumes/Sauce/wda/wda-v1.19.1-xcode12.2/WebDriverAgent/DerivedData/WebdriverAgent',
      'webdriver.remote.quietExceptions': false,
      locationContextEnabled: false,
      platform: 'MAC',
      'webdriver.remote.sessionid': '3628c672f8d24271b58e28bd5d11717d',
      maxTypingFrequency: 8,
      platformName: 'iOS',
      automationName: 'XCUITest',
      javascriptEnabled: true,
      showIOSLog: false,
      databaseEnabled: false,
      noReset: true,
      usePrebuiltWDA: true,
      browserName: '',
      hasMetadata: true,
      platformVersion: '13.4',
      webStorageEnabled: false,
      eventTimings: true,
      keepKeyChains: true,
      launchTimeout: 180000,
      udid: '99195D1C-1BF8-46F9-A4B8-E91285AF8D4E',
      backendRetries: 4,
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: undefined,
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '13.4',
      deviceName: 'iPhone 11 Pro',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: true,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: undefined,
      statusBarSize: undefined,
    })
  })

  it('should work with Native App on iPhone XS using Appium 1.19 in Sauce', () => {
    const capabilities = {
      deviceName: 'iPhone XS',
      orientation: 'PORTRAIT',
      viewportRect: {width: 1125, top: 132, height: 2304, left: 0},
      app: '/var/folders/qv/8dr6ylkn3c98dm4r414wh_0h0000kr/T/tmpnewfb6/eyes-ios-hello-world.zip',
      noReset: true,
      CFBundleIdentifier: 'Org.HelloWorldiOS',
      platformVersion: '13.0',
      bootstrapPath: '/Volumes/Sauce/wda/wda-v1.19.1-xcode12.2/WebDriverAgent',
      newCommandTimeout: 0,
      preventWDAAttachments: true,
      'webdriver.remote.quietExceptions': false,
      derivedDataPath: '/Volumes/Sauce/wda/wda-v1.19.1-xcode12.2/WebDriverAgent/DerivedData/WebdriverAgent',
      'webdriver.remote.sessionid': '1f6187567b8a4241b742c58314cc30de',
      maxTypingFrequency: 8,
      platformName: 'iOS',
      events: {
        xcodeDetailsRetrieved: [1637221290223],
        orientationSet: [1637221327085],
        commands: [[Object], [Object]],
        wdaStarted: [1637221326530],
        resetComplete: [1637221291250],
        appConfigured: [1637221291245],
        logCaptureStarted: [1637221310412],
        wdaSessionStarted: [1637221326530],
        wdaSessionAttempted: [1637221324946],
        appInstalled: [1637221314563],
        simStarted: [1637221309573],
        wdaStartAttempted: [1637221314650],
        resetStarted: [1637221291249],
      },
      pixelRatio: 3,
      showIOSLog: false,
      usePrebuiltWDA: true,
      browserName: 'HelloWorldiOS',
      hasMetadata: true,
      device: 'iphone',
      eventTimings: true,
      keepKeyChains: true,
      sdkVersion: '13.0',
      launchTimeout: 180000,
      udid: '025C7C8B-220D-4BD8-B88E-1018F83EEADE',
      statBarHeight: 44,
      backendRetries: 4,
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: undefined,
      browserVersion: undefined,
      platformName: 'iOS',
      platformVersion: '13.0',
      deviceName: 'iPhone XS',
      isW3C: true,
      isECClient: false,
      isMobile: true,
      isNative: true,
      isChrome: false,
      isIOS: true,
      isAndroid: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: 'portrait',
      pixelRatio: 3,
      statusBarSize: 44,
    })
  })

  it('should work with Native App without app capability', () => {
    const capabilities = {
      udid: '99434533-FB36-4B25-A6D0-BB42ECAFB46D',
      platformName: 'ios',
      animationCoolOffTimeout: 2,
      autoAcceptAlerts: false,
      autoGrantPermissions: 'true',
      automationName: 'XCUITest',
      deviceName: 'DD-QA-iPhone-14-Pro-Max',
      environment: 'PROD',
      executeCompareModelsSet: '1',
      eyes: 'true',
      locales: 'en_US',
      model: 'iphone14promax',
      mpn: 'MQAM3ZP/A',
      newCommandTimeout: 600000,
      platformVersion: '16.0',
      product: 'iphone',
      savelocalscreenshots: 'false',
      useJSONSource: true,
      usePrebuiltWDA: true,
      wdaConnectionTimeout: 600000,
      device: 'iphone',
      browserName: 'Explore',
      sdkVersion: '16.0',
      CFBundleIdentifier: 'com.apple.ist.DemoDiscoveryApp',
      pixelRatio: 3,
      statBarHeight: 54,
      viewportRect: {left: 0, top: 162, width: 1290, height: 2634},
    }
    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: undefined,
      browserVersion: undefined,
      platformName: 'ios',
      platformVersion: '16.0',
      deviceName: 'DD-QA-iPhone-14-Pro-Max',
      isAndroid: false,
      isChrome: false,
      isIOS: true,
      isMobile: true,
      isNative: true,
      isW3C: true,
      isECClient: false,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: undefined,
      orientation: undefined,
      pixelRatio: 3,
      statusBarSize: 54,
    })
  })

  it('should work with Native App with appium prefixed capabilities', () => {
    const capabilities = {
      'appium:newCommandTimeout': 0,
      'appium:takesScreenshot': true,
      'appium:warnings': {},
      'appium:desired': {
        'sauce:options': {},
        deviceName: 'Google Pixel 3a XL GoogleAPI Emulator',
        orientation: 'PORTRAIT',
        udid: 'emulator-5554',
        app: '/tmp/tmpivzMax/app-debug.apk',
        noReset: true,
        'selenium:webdriver.remote.quietExceptions': false,
        chromeOptions: {
          args: [
            '--disable-fre',
            '--disable-popup-blocking',
            '--enable-automation',
            '--enable-remote-debugging',
            '--ignore-certificate-errors',
            '--metrics-recording-only',
            '--no-first-run',
            '--disable-search-geolocation-disclosure',
            '--disable-gpu-rasterization',
          ],
        },
        browserName: '',
        'noSign:noSign': true,
        proxy: {
          proxyAutoconfigUrl: 'http://127.0.0.1:19876/pac.js',
          proxyType: 'PAC',
        },
        newCommandTimeout: 0,
        platformVersion: '10.0',
        platformName: 'android',
        eventTimings: true,
        maxTypingFrequency: 8,
      },
      'appium:deviceApiLevel': 29,
      'appium:locationContextEnabled': false,
      'appium:deviceScreenSize': '1080x2160',
      'appium:deviceManufacturer': 'Google',
      'sauce:options': {},
      'selenium:webdriver.remote.quietExceptions': false,
      'appium:udid': 'emulator-5554',
      'appium:pixelRatio': 2.5,
      'appium:orientation': 'PORTRAIT',
      platformName: 'ANDROID',
      'appium:app': '/tmp/tmpivzMax/app-debug.apk',
      'appium:networkConnectionEnabled': true,
      'appium:eventTimings': true,
      'appium:deviceScreenDensity': 400,
      'appium:viewportRect': {width: 1080, top: 60, height: 1980, left: 0},
      'appium:deviceModel': 'Android SDK built for x86_64',
      'appium:platformVersion': '10',
      'appium:noReset': true,
      'appium:databaseEnabled': false,
      proxy: {
        proxyType: 'PAC',
        autodetect: false,
        ftpProxy: null,
        httpProxy: null,
        noProxy: null,
        sslProxy: null,
        socksProxy: null,
        socksVersion: null,
        socksUsername: null,
        socksPassword: null,
        proxyAutoconfigUrl: 'http://127.0.0.1:19876/pac.js',
      },
      'appium:deviceUDID': 'emulator-5554',
      'appium:statBarHeight': 60,
      'appium:webStorageEnabled': false,
      'appium:chromeOptions': {
        args: [
          '--disable-fre',
          '--disable-popup-blocking',
          '--enable-automation',
          '--enable-remote-debugging',
          '--ignore-certificate-errors',
          '--metrics-recording-only',
          '--no-first-run',
          '--disable-search-geolocation-disclosure',
          '--disable-gpu-rasterization',
        ],
      },
      'appium:deviceName': 'emulator-5554',
      'appium:javascriptEnabled': true,
      'appium:maxTypingFrequency': 8,
      'noSign:noSign': true,
      'appium:appPackage': 'com.applitools.eyes.android',
    }

    const environment = extractCapabilitiesEnvironment(capabilities)
    const viewport = extractCapabilitiesViewport(capabilities)

    assert.deepStrictEqual(environment, {
      browserName: undefined,
      browserVersion: undefined,
      platformName: 'ANDROID',
      platformVersion: '10',
      isW3C: true,
      isMobile: true,
      isChrome: false,
      isECClient: false,
      deviceName: 'Google Pixel 3a XL GoogleAPI Emulator',
      isIOS: false,
      isAndroid: true,
      isNative: true,
    })
    assert.deepStrictEqual(viewport, {
      displaySize: {width: 1080, height: 2160},
      orientation: 'portrait',
      pixelRatio: 2.5,
      statusBarSize: 60,
      navigationBarSize: 120,
    })
  })
})
