# karma-cucumberjs-allure-reporter

> Reporter for the Allure XML format. It allows to make detailed report

## Installation

Install karma-cucumberjs-allure-reporter into your project as devDependency
```json
{
  "devDependencies": {
    "karma": "~0.10",
    "karma-allure-reporter": "~1.0.0"
  }
}
```

You can simple do it by:
```bash
npm install karma-cucumberjs-allure-reporter --save-dev
```

## Configuration

Add allure into `reporters` section.
Allure-reporter has a single config, it's a `reportDir` &mdash; result files location relatively to base dir. By default,
files save right in the base dir.

```js
// karma.conf.js
module.exports = function(config) {
  config.set({
    reporters: ['progress', 'cucumber-allure'],

    // the default configuration
    allureReport: {
      reportDir: '',
    }
  });
};
```