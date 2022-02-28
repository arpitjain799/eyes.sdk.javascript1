// const {describe, it} = require('mocha');
// const {expect} = require('chai');
// const {eyesOpenMapValues} = require('../../../src/browser/eyesOpenMapping');

// describe('eyes open mapping', () => {
//   it('should work with eyes open config', () => {
//     const args = {
//       browser: [
//         {width: 1200, height: 1000, name: 'chrome'},
//         {width: 800, height: 1000, name: 'chrome'},
//       ],
//     };

//     const expected = {
//       browsersInfo: [
//         {width: 1200, height: 1000, name: 'chrome'},
//         {width: 800, height: 1000, name: 'chrome'},
//       ],
//     };
//     const cypress = {
//       config: prop => {
//         if (prop === 'appliConfFile') {
//           return {};
//         } else {
//           return undefined;
//         }
//       },
//     };
//     const coreConfig = eyesOpenMapValues({args, cypress});
//     expect(coreConfig).to.be.deep.equal(expected);
//   });

//   it('should work with config file', () => {
//     const args = {};

//     const expected = {
//       browsersInfo: [
//         {width: 1200, height: 1000, name: 'chrome'},
//         {width: 800, height: 1000, name: 'chrome'},
//       ],
//       apiKey: 'my api key',
//       showLogs: true,
//     };
//     const cypress = {
//       config: prop => {
//         if (prop === 'appliConfFile') {
//           return {
//             browser: [
//               {width: 1200, height: 1000, name: 'chrome'},
//               {width: 800, height: 1000, name: 'chrome'},
//             ],
//             apiKey: 'my api key',
//             showLogs: true,
//           };
//         } else {
//           return undefined;
//         }
//       },
//     };
//     const coreConfig = eyesOpenMapValues({args, cypress});
//     expect(coreConfig).to.be.deep.equal(expected);
//   });

//   it('eyes open config should have precedence over config file', () => {
//     const args = {
//       browser: [
//         {width: 1200, height: 1000, name: 'chrome'},
//         {width: 800, height: 1000, name: 'chrome'},
//       ],
//     };

//     const expected = {
//       browsersInfo: [
//         {width: 1200, height: 1000, name: 'chrome'},
//         {width: 800, height: 1000, name: 'chrome'},
//       ],
//     };
//     const cypress = {
//       config: prop => {
//         if (prop === 'appliConfFile') {
//           return {
//             browser: [
//               {width: 1100, height: 800, name: 'chrome'},
//               {width: 1400, height: 650, name: 'chrome'},
//             ],
//           };
//         } else {
//           return undefined;
//         }
//       },
//     };
//     const coreConfig = eyesOpenMapValues({args, cypress});
//     expect(coreConfig).to.be.deep.equal(expected);
//   });
// });
