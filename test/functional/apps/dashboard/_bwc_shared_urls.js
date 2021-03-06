/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import expect from 'expect.js';

export default function ({ getService, getPageObjects }) {
  const PageObjects = getPageObjects(['dashboard', 'header']);
  const dashboardExpect = getService('dashboardExpect');
  const remote = getService('remote');
  const log = getService('log');
  const queryBar = getService('queryBar');

  let kibanaBaseUrl;

  const urlQuery = `` +
    `_g=(refreshInterval:(pause:!t,value:0),` +
        `time:(from:'2012-11-17T00:00:00.000Z',mode:absolute,to:'2015-11-17T18:01:36.621Z'))&` +
    `_a=(description:'',filters:!(),` +
        `fullScreenMode:!f,` +
        `options:(darkTheme:!f),` +
        `panels:!((col:1,id:Visualization-MetricChart,panelIndex:1,row:1,size_x:6,size_y:3,type:visualization),` +
                 `(col:7,id:Visualization-PieChart,panelIndex:2,row:1,size_x:6,size_y:3,type:visualization)),` +
        `query:(language:lucene,query:'memory:%3E220000'),` +
        `timeRestore:!f,` +
        `title:'New+Dashboard',` +
        `uiState:(P-1:(vis:(defaultColors:('0+-+100':'rgb(0,104,55)'))),` +
                 `P-2:(vis:(colors:('200,000':%23F9D9F9,` +
                                   `'240,000':%23F9D9F9,` +
                                   `'280,000':%23F9D9F9,` +
                                   `'320,000':%23F9D9F9,` +
                                   `'360,000':%23F9D9F9),` +
                  `legendOpen:!t))),` +
        `viewMode:edit)`;

  describe('bwc shared urls', function describeIndexTests() {
    before(async function () {
      await PageObjects.dashboard.initTests();

      const currentUrl = await remote.getCurrentUrl();
      kibanaBaseUrl = currentUrl.substring(0, currentUrl.indexOf('#'));
    });

    describe('6.0 urls', () => {

      it('loads an unsaved dashboard', async function () {
        const url = `${kibanaBaseUrl}#/dashboard?${urlQuery}`;
        log.debug(`Navigating to ${url}`);
        await remote.get(url, true);
        await PageObjects.header.waitUntilLoadingHasFinished();

        const query = await queryBar.getQueryString();
        expect(query).to.equal('memory:>220000');

        await dashboardExpect.pieSliceCount(5);
        await dashboardExpect.panelCount(2);
        await dashboardExpect.selectedLegendColorCount('#F9D9F9', 5);
      });

      it('loads a saved dashboard', async function () {
        await PageObjects.dashboard.saveDashboard('saved with colors', { storeTimeWithDashboard: true });

        const id = await PageObjects.dashboard.getDashboardIdFromCurrentUrl();
        const url = `${kibanaBaseUrl}#/dashboard/${id}`;
        await remote.get(url, true);
        await PageObjects.header.waitUntilLoadingHasFinished();

        const query = await queryBar.getQueryString();
        expect(query).to.equal('memory:>220000');

        await dashboardExpect.pieSliceCount(5);
        await dashboardExpect.panelCount(2);
        await dashboardExpect.selectedLegendColorCount('#F9D9F9', 5);
      });

      it('uiState in url takes precedence over saved dashboard state', async function () {
        const id = await PageObjects.dashboard.getDashboardIdFromCurrentUrl();
        const updatedQuery = urlQuery.replace(/F9D9F9/g, '000000');
        const url = `${kibanaBaseUrl}#/dashboard/${id}?${updatedQuery}`;

        await remote.get(url, true);
        await PageObjects.header.waitUntilLoadingHasFinished();

        await dashboardExpect.selectedLegendColorCount('#000000', 5);
      });
    });
  });
}
