export function stateUrl () {
  let url = window.location.href.split('?')[0].split('#')[0].split('/')
  url = url.filter(function (el) {
    return el !== ''
  })

  console.log(url)
  url.splice(0, 2)
  console.log(url)
  return url
}
