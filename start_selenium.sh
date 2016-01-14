# Determine versions
SELENIUM_SERVER_VERSION=2.40.0
CHROME_DRIVER_VERSION=2.20

# Install and start selenium server with chrome driver
./node_modules/.bin/selenium-standalone install --version=$SELENIUM_SERVER_VERSION --drivers.chrome.version=$CHROME_DRIVER_VERSION
./node_modules/.bin/selenium-standalone start --version=$SELENIUM_SERVER_VERSION --drivers.chrome.version=$CHROME_DRIVER_VERSION
