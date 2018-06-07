/**
 * load in the csv file...
 * load in all sources & organisations & categories
 * check if sources exist
 * create if they dont
 */

const fs = require('fs');
const glob = require('glob');
const _ = require('lodash');

const organizations = {};
const sources = {};

function readAllOrganizations() {
  const allFiles = glob.sync('./organizations/*.json');
  allFiles.forEach(f => {
    const data = fs.readFileSync(f);
    const org = JSON.parse(data);
    organizations[org.id] = org;
  });
}

function readAllSources() {
  const allFiles = glob.sync('./sources/*.json');
  allFiles.forEach(f => {
    const data = fs.readFileSync(f);
    const src = JSON.parse(data);
    sources[src.id] = src;
  });
}

function trim(text) {
  if (text.trim) {
    return text.trim();
  } else {
    return trim.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  }
}

function parseTsvResponse(data) {
  if (!data) {
    return [];
  }
  var rows = data.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);
  rows = rows.map(function(row) {
    var items = row.split(/\t/);
    items.map(trim);
    return items;
  });
  return rows;
}

function readSourceTracker() {
  const rawdata = fs.readFileSync('./scripts/source-tracker.tsv', {
    encoding: 'utf8',
  });
  const funnelSources = parseTsvResponse(rawdata)
    .slice(1)
    .map(row => ({
      id: row[0],
      gdsSourceId: row[2],
      gdsOrgId: row[3],
      gdsSourceUrl: row[5],
      gdsCategory: row[6],
    }))
    .filter(src => src.gdsSourceId);

  const sourcesToAdd = funnelSources.filter(
    src => sources[src.gdsSourceId] === undefined
  );
  return Promise.resolve(sourcesToAdd);
}

function makeSource(src) {
  sourceType = fs.readFileSync(`./funnel-source-type-config/${src.id}.json`);
  const sourceTypeConfig = JSON.parse(sourceType);
  const gdsSource = {
    id: src.gdsSourceId,
    name: sourceTypeConfig.sourceTypeDef.name,
    categories: [src.gdsCategory],
    organization: src.gdsOrgId,
    iconUrl: `https://static.funnel.io/logos/icon48x48/${src.id}.png`,
    sourceUrl: src.gdsSourceUrl,
    dataVisibility: ['PRIVATE'],
  };
  fs.writeFileSync(
    `./sources/${_.toLower(gdsSource.id)}.json`,
    JSON.stringify(gdsSource)
  );
  return gdsSource;
}

function makeOrganization(gdsSource) {
  if (!organizations[gdsSource.organization]) {
    const org = {
      id: gdsSource.organization,
      name: _.capitalize(gdsSource.organization),
      orgUrl: gdsSource.sourceUrl,
      iconUrl: gdsSource.iconUrl,
    };
    fs.writeFileSync(
      `./organizations/${_.toLower(gdsSource.organization)}.json`,
      JSON.stringify(org)
    );
  }
}

function makeSources(sources) {
  sources.map(makeSource).forEach(gdsSource => {
    makeOrganization(gdsSource);
  });
}

// GO!
readAllOrganizations();
readAllSources();
readSourceTracker().then(makeSources);
