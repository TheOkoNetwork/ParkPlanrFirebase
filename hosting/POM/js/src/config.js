export function config (key) {
  const configStore = {}
  configStore.firebaseDevEnviromentProject = 'parkplanr-dev'
  configStore.SiteDefaultTitle = 'ParkPlanr'
  configStore.DevEnviromentFirebaseFunctionsUrl =
    'https://us-central1-parkplanr-dev.cloudfunctions.net'
  configStore.version = '{{APP_VERSION_HERE}}'
  configStore.publicUrl = 'parkplanr.app'

  configStore.firebaseFunctionsUrl =
    'https://us-central1-parkplanr-dev.cloudfunctions.net'

  if (!key) {
    return configStore
  }

  if (configStore[key]) {
    return configStore[key]
  } else {
    throw new Error(`Config key: ${key} unknown`)
  }
}
