export function config (key) {
  var configStore = {}
  configStore.firebaseDevEnviromentProject = 'parkplanr-dev'
  configStore.SiteDefaultTitle = 'ParkPlanr'
  configStore.DevEnviromentFirebaseFunctionsUrl = 'https://us-central1-parkplanr-dev.cloudfunctions.net'
  configStore.version = '{{APP_VERSION_HERE}}'

  if (!key) {
    return configStore;
  };

  if (configStore[key]) {
    return configStore[key]
  } else {
    throw new Error(`Config key: ${key} unknown`)
  };
};
