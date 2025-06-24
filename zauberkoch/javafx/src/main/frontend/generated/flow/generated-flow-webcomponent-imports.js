import { injectGlobalWebcomponentCss } from 'Frontend/generated/jar-resources/theme-util.js';

import { injectGlobalCss } from 'Frontend/generated/jar-resources/theme-util.js';

import { css, unsafeCSS, registerStyles } from '@vaadin/vaadin-themable-mixin';
import $cssFromFile_0 from 'Frontend/styles/main-view.css?inline';
import $cssFromFile_1 from 'Frontend/generated/jar-resources/paper-slider-field.css?inline';
import $cssFromFile_2 from 'Frontend/styles/sparkle.css?inline';
import $cssFromFile_3 from 'Frontend/styles/drunk-style.css?inline';
import $cssFromFile_4 from 'Frontend/generated/jar-resources/paper-slider.css?inline';
import $cssFromFile_5 from 'Frontend/styles/login-view.css?inline';
import 'Frontend/generated/jar-resources/flow-component-renderer.js';
import '@vaadin/polymer-legacy-adapter/style-modules.js';
import '@vaadin/combo-box/theme/lumo/vaadin-combo-box.js';
import 'Frontend/generated/jar-resources/comboBoxConnector.js';
import 'Frontend/generated/jar-resources/vaadin-grid-flow-selection-column.js';
import '@vaadin/grid/theme/lumo/vaadin-grid-column.js';
import '@vaadin/accordion/theme/lumo/vaadin-accordion.js';
import '@vaadin/radio-group/theme/lumo/vaadin-radio-group.js';
import '@vaadin/radio-group/theme/lumo/vaadin-radio-button.js';
import '@vaadin/app-layout/theme/lumo/vaadin-app-layout.js';
import '@vaadin/tooltip/theme/lumo/vaadin-tooltip.js';
import '@vaadin/tabs/theme/lumo/vaadin-tab.js';
import '@vaadin/icon/theme/lumo/vaadin-icon.js';
import '@vaadin/progress-bar/theme/lumo/vaadin-progress-bar.js';
import '@vaadin/context-menu/theme/lumo/vaadin-context-menu.js';
import 'Frontend/generated/jar-resources/contextMenuConnector.js';
import 'Frontend/generated/jar-resources/contextMenuTargetConnector.js';
import '@vaadin/multi-select-combo-box/theme/lumo/vaadin-multi-select-combo-box.js';
import '@vaadin/grid/theme/lumo/vaadin-grid.js';
import '@vaadin/grid/theme/lumo/vaadin-grid-sorter.js';
import '@vaadin/checkbox/theme/lumo/vaadin-checkbox.js';
import 'Frontend/generated/jar-resources/gridConnector.ts';
import '@vaadin/button/theme/lumo/vaadin-button.js';
import '@vaadin/details/theme/lumo/vaadin-details.js';
import '@vaadin/text-field/theme/lumo/vaadin-text-field.js';
import '@vaadin/icons/vaadin-iconset.js';
import '@vaadin/dialog/theme/lumo/vaadin-dialog.js';
import '@vaadin/text-area/theme/lumo/vaadin-text-area.js';
import 'Frontend/scripts/sparkle.js';
import 'Frontend/scripts/drunk-effects.js';
import '@vaadin/vertical-layout/theme/lumo/vaadin-vertical-layout.js';
import '@vaadin/app-layout/theme/lumo/vaadin-drawer-toggle.js';
import '@vaadin/tabsheet/theme/lumo/vaadin-tabsheet.js';
import '@vaadin/horizontal-layout/theme/lumo/vaadin-horizontal-layout.js';
import '@vaadin/tabs/theme/lumo/vaadin-tabs.js';
import 'Frontend/generated/jar-resources/disableOnClickFunctions.js';
import '@vaadin/grid/theme/lumo/vaadin-grid-column-group.js';
import '@vaadin/custom-field/theme/lumo/vaadin-custom-field.js';
import '@polymer/paper-slider/paper-slider.js';
import 'Frontend/generated/jar-resources/lit-renderer.ts';
import '@vaadin/accordion/theme/lumo/vaadin-accordion-panel.js';
import '@vaadin/notification/theme/lumo/vaadin-notification.js';
import '@vaadin/login/theme/lumo/vaadin-login-form.js';
import '@vaadin/common-frontend/ConnectionIndicator.js';
import '@vaadin/vaadin-lumo-styles/sizing.js';
import '@vaadin/vaadin-lumo-styles/spacing.js';
import '@vaadin/vaadin-lumo-styles/style.js';
import '@vaadin/vaadin-lumo-styles/vaadin-iconset.js';
import 'Frontend/generated/jar-resources/ReactRouterOutletElement.tsx';

injectGlobalCss($cssFromFile_0.toString(), 'CSSImport end', document);
injectGlobalWebcomponentCss($cssFromFile_0.toString());

injectGlobalCss($cssFromFile_1.toString(), 'CSSImport end', document);
injectGlobalWebcomponentCss($cssFromFile_1.toString());

injectGlobalCss($cssFromFile_2.toString(), 'CSSImport end', document);
injectGlobalWebcomponentCss($cssFromFile_2.toString());

injectGlobalCss($cssFromFile_3.toString(), 'CSSImport end', document);
injectGlobalWebcomponentCss($cssFromFile_3.toString());

injectGlobalCss($cssFromFile_4.toString(), 'CSSImport end', document);
injectGlobalWebcomponentCss($cssFromFile_4.toString());

injectGlobalCss($cssFromFile_5.toString(), 'CSSImport end', document);
injectGlobalWebcomponentCss($cssFromFile_5.toString());

const loadOnDemand = (key) => {
  const pending = [];
  if (key === '78b3ecc8b0a984b64179bad3b91ea71dcb90439a9a5da2f307dbbefe558c6675') {
    pending.push(import('./chunks/chunk-d1697a5540d41f969bc46acac3ea28e354198cac8e693978835f328b11359ca6.js'));
  }
  if (key === '7ece843917644f5e5600dfa1811345da1fa9854828ffd0ac40ebae0d408d033b') {
    pending.push(import('./chunks/chunk-48b9eeee13cacdf2b8dc7182451e942bc52d1dd9944a332ab740a3f57906050d.js'));
  }
  if (key === '77756579177f96812562a2f6e59041f4bebfd5312abd91a067a0fb275ddabf7e') {
    pending.push(import('./chunks/chunk-b160ec825fe2bbf2742cf4636f515cdaa1d40b96d51d00dfbd88d67e015c4b90.js'));
  }
  if (key === '180567d2b94211654875cfaf2358bed0feeaf1fff1c574b4fb47f6fea54e22dc') {
    pending.push(import('./chunks/chunk-cd6a3b6f6faebed1493d078a30ed7b10109a53d1122ed5addaf07959b749bfe6.js'));
  }
  if (key === 'b159f517dfa009d885dc40c3f5de7049a3e4922420db1a9715d00e76d9df5f87') {
    pending.push(import('./chunks/chunk-193f5ed0e3315de7f95341217ee386f2e46945767240f7dbc7946fa66f36d335.js'));
  }
  if (key === '9c41f9474d6dbabdb9a8026eef584a6da71a58f0df21bd2b0f60c783efd32a70') {
    pending.push(import('./chunks/chunk-a70d0788f2d45404fdbb6cbb336c3b12cfbb47170329fbec16d42fb651a03af8.js'));
  }
  if (key === '9f4a489bd4f5c4066af0b0a395c8c8fb19c17925948915837eb1cd24289dc68d') {
    pending.push(import('./chunks/chunk-4bfd5a08c35aa4e2022743cfa1efc4e4d87defa27e4104675da3ee2b509380e4.js'));
  }
  if (key === '691aab05a1bf5945935990e27e83c683d588ff466b3f77832cb94e34485843a0') {
    pending.push(import('./chunks/chunk-d0fdb56f28959b2e584a72ed729a49bc1c6b7a592b021a4d59d311d0f507cb92.js'));
  }
  if (key === '2ec265d1ca4c70fb15fe1da9d0d2b6de60aa13ac5f67b5afebcdf434e3bd7cb6') {
    pending.push(import('./chunks/chunk-a70d0788f2d45404fdbb6cbb336c3b12cfbb47170329fbec16d42fb651a03af8.js'));
  }
  if (key === '176aade4774ea0db0b5fd964f76e416ddd06daa23a1df5fb13f9b0059e191f99') {
    pending.push(import('./chunks/chunk-39c521c209d62b68c2c3f66b52c7a4f5835741e15257be37b4d8bc8051853388.js'));
  }
  if (key === 'bfa5ffea0f6bbaf84c70ca891f9199cf8fe6df43cd63b5fa991039b67f0d2fe8') {
    pending.push(import('./chunks/chunk-85892189ce26720c6ce6a6b10fbeb4dc8283d622b8400eb02285af233495a814.js'));
  }
  if (key === '1a9b3341c31c8e29d10cc85a64ddff18e7168ace73735a6cd429fe998969f66c') {
    pending.push(import('./chunks/chunk-a70d0788f2d45404fdbb6cbb336c3b12cfbb47170329fbec16d42fb651a03af8.js'));
  }
  if (key === '492ae48b07b6ffe9e2058d0cd950c1c81f82c081212767854e497907349c8714') {
    pending.push(import('./chunks/chunk-a70d0788f2d45404fdbb6cbb336c3b12cfbb47170329fbec16d42fb651a03af8.js'));
  }
  if (key === 'e2ac872d857d95e977d5d61c505e342fb6f265531c85b3ffb32de755782cc35f') {
    pending.push(import('./chunks/chunk-2c3a0a72c266d0fe75cb1b0e5cfa0aa8cf9464858915fe3d6561775d151f77f2.js'));
  }
  if (key === '8f466c96cef87da95b45c95e64040435ff24737e2ff8df834de9e3d34f9a2f1d') {
    pending.push(import('./chunks/chunk-d0fdb56f28959b2e584a72ed729a49bc1c6b7a592b021a4d59d311d0f507cb92.js'));
  }
  if (key === '9bf98d3fb586f2a283ea0df762d9027f595d4996637388eea16b45d3b609ebd5') {
    pending.push(import('./chunks/chunk-bd91b63441a7c05cc2c7fde360147f7176334bc31eec9e4a8e1c168b58459c56.js'));
  }
  if (key === 'ad2522cc53ae844b3fce0793639cc2c808772042acc2fcc3e3de3a98138b33ef') {
    pending.push(import('./chunks/chunk-d22de8413906a749ca849df5cd108a5e388c22b469596aae580dfe1284e13a81.js'));
  }
  if (key === '371626efa6d53579ebf83eb4ebeee7b4865ecfa0af886ce8786a9138bd62d687') {
    pending.push(import('./chunks/chunk-d0fdb56f28959b2e584a72ed729a49bc1c6b7a592b021a4d59d311d0f507cb92.js'));
  }
  return Promise.all(pending);
}

window.Vaadin = window.Vaadin || {};
window.Vaadin.Flow = window.Vaadin.Flow || {};
window.Vaadin.Flow.loadOnDemand = loadOnDemand;
window.Vaadin.Flow.resetFocus = () => {
 let ae=document.activeElement;
 while(ae&&ae.shadowRoot) ae = ae.shadowRoot.activeElement;
 return !ae || ae.blur() || ae.focus() || true;
}