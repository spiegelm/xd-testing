# XD-Test-gallery

Analyse existing tools for automated testing of web applications, starting with those mentioned in this proposal.

Unit under testing: gallery-polymer from XD-MCD/Examples/Gallery

## Selenium server + webdriver.io

WebdriverIO: WebDriver implementation. Selenium 2.0 javascript bindings for nodejs

    # Ensure gallery-polymer.js is up and running at http://me.local:8082/gallery.html
    # Adjust the URL via the variable baseUrl in test_webdriver_io.js
    
    # Start the selenium server
    npm install
    chmod +x start_selenium.sh
    ./start_selenium.sh
    
    # In a different terminal:
    npm install
    node test_webdriver_io.js

