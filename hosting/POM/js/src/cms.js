import EditorJS from '@editorjs/editorjs'
import ImageTool from '@editorjs/image'
import List from '@editorjs/list'
import { config } from './config.js'
const Fuse = require('fuse.js').default
const Table = require('@editorjs/table')
const Header = require('@editorjs/header')
const LinkTool = require('@editorjs/link')
const RawTool = require('@editorjs/raw')
const Checklist = require('@editorjs/checklist')
const Embed = require('@editorjs/embed')
const Quote = require('@editorjs/quote')

let adminCMSPagesEditor
async function cmsPageLoadEdit (params = {}) {
  if (!window.db) {
    console.log('DB not ready yet, unable to load edit page')
    $('body').on('dbLoaded', function () {
      console.log('DB Loaded, loading cms edit page')
      cmsPageLoadEdit(params)
    })
    return
  }
  if (!window.storage) {
    console.log('Storage not ready yet, unable to load edit page')
    $('body').on('storageLoaded', function () {
      console.log('Storage Loaded, loading cms edit page')
      cmsPageLoadEdit(params)
    })
    return
  }

  $('#cmsPageDeleteButton').on('click', async function () {
    console.log('CMS delete button clicked')
    // TODO: This but prettier
    const deleteConfirm = window.confirm(
      'Are you sure you want to delete this page?'
    )
    if (deleteConfirm) {
      console.log('Deleting')

      const pageId = window.router._lastRouteResolved.params.pageId
      const cmsPageDoc = window.db.collection('cmsPages').doc(pageId)
      await cmsPageDoc.delete()
      console.log('Deleted')
      window.router.navigate(window.router.generate('cmsPage.list'))
      window.alert('Page deleted')
    } else {
      console.log('Aborting delete')
    }
  })

  $('#cmsPageSaveButton').on('click', async function () {
    console.log('CMS save button clicked')
    console.log(adminCMSPagesEditor)

    const title = $('#pageCmsEditTitle').val()
    const subTitle = $('#pageCmsEditTitle').val()
    const slug = $('#pageCmsEditSlug').val()

    // TODO: Implement the public checkbox
    const publicPage = true
    // var publicPage = $('#AdminCMSPagesPublic-0').is(':checked')

    if (!title) {
      console.log('Title missing')
      return
    }
    if (!slug) {
      console.log('SLUG missing')
      return
    }

    console.log('Fetching page content from editor')
    const pageContent = await adminCMSPagesEditor.save()
    console.log(pageContent)

    let pageId
    let cmsPageDoc
    if (
      window.router._lastRouteResolved.params &&
      window.router._lastRouteResolved.params.pageId
    ) {
      console.log('Saving')
      pageId = window.router._lastRouteResolved.params.pageId
      cmsPageDoc = window.db.collection('cmsPages').doc(pageId)
    } else {
      console.log('Adding')
      cmsPageDoc = window.db.collection('cmsPages').doc()
    }

    console.log('Writing document')
    await cmsPageDoc.set(
      {
        public: publicPage,
        content: JSON.stringify(pageContent),
        title: title,
        subTitle: subTitle,
        slug: slug,
        lastEditedByUser: window.auth.currentUser.uid
      },
      { merge: true }
    )
    console.log('Saved')
    window.router.navigate(
      window.router.generate('cmsPage.edit', { pageId: cmsPageDoc.id })
    )
    // TODO: This bit nicer
    window.alert('Saved!')
  })

  let cmsPageData
  if (params && params.pageId) {
    console.log('Loading page to edit')
    $('.showIfCmsEdit').show()
    $('.showIfCmsAdd').hide()

    const cmsPageDoc = await window.db
      .collection('cmsPages')
      .doc(params.pageId)
      .get()
    console.log(cmsPageDoc.id)
    console.log(cmsPageDoc.data())
    $('#pageCmsEditSlug').val(cmsPageDoc.data().slug)
    $('#pageCmsEditTitle').val(cmsPageDoc.data().title)
    $('#pageCmsEditSubTitle').val(cmsPageDoc.data().subTitle)

    cmsPageData = cmsPageDoc.data().content
    if (typeof cmsPageData === 'string') {
      cmsPageData = JSON.parse(cmsPageData)
    }
  } else {
    console.log('New CMS page, no page to load')

    $('.showIfCmsEdit').hide()
    $('.showIfCmsAdd').show()

    $('#pageCmsEditSlug').val('')
    $('#pageCmsEditTitle').val('')
    $('#pageCmsEditSubTitle').val('')
  }

  adminCMSPagesEditor = new EditorJS({
    holder: 'cmsPagesEditor',
    autofocus: true,
    data: cmsPageData,
    tools: {
      table: {
        class: Table,
        inlineToolbar: true
      },
      header: {
        class: Header,
        shortcut: 'CMD+SHIFT+H'
      },
      linkTool: {
        class: LinkTool,
        config: {
          endpoint: `${config('firebaseFunctionsUrl')}/EditorApiLinkFetch`
        }
      },
      raw: RawTool,
      image: {
        class: ImageTool,
        config: {
          uploader: {
            uploadByUrl (url) {
              return $.ajax({
                url: url,
                method: 'GET',
                xhrFields: {
                  responseType: 'arraybuffer'
                },
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
              })
                .then(function (file) {
                  console.log('Fetched image')
                  const uint = new Uint8Array(file.slice(0, 4))
                  const bytes = []
                  uint.forEach((byte) => {
                    bytes.push(byte.toString(16))
                  })
                  const hex = bytes.join('').toUpperCase()
                  let filetype
                  console.log(hex)
                  switch (hex) {
                    case '89504E47':
                      filetype = 'image/png'
                      break
                    case '47494638':
                      filetype = 'image/gif'
                      break
                    case 'FFD8FFDB':
                    case 'FFD8FFE0':
                    case 'FFD8FFE1':
                      filetype = 'image/jpeg'
                      break
                    default:
                      console.log(`Unknown file magic number: ${hex}`)
                      return {
                        success: 0
                      }
                  }
                  console.log(filetype)
                  const imageID = window.db.collection('CMSImages').doc().id

                  const metadata = {
                    contentType: filetype
                  }

                  return window.storage
                    .ref()
                    .child(`CMSImages/${imageID}`)
                    .put(file, metadata)
                    .then(function (ImageSnapshot) {
                      console.log('Uploaded file')
                      console.log(ImageSnapshot)
                      return ImageSnapshot.ref
                        .getDownloadURL()
                        .then(function (url) {
                          const imageUrl = url.split('&token')[0]
                          console.log(`Got image URL: ${imageUrl}`)
                          return {
                            success: 1,
                            file: {
                              url: imageUrl
                            }
                          }
                        })
                        .catch(function (errorObject) {
                          console.log('Error getting file url')
                          console.log(errorObject)
                          return {
                            success: 0
                          }
                        })
                    })
                    .catch(function (errorObject) {
                      console.log('Error uploading file')
                      console.log(errorObject)
                      return {
                        success: 0
                      }
                    })
                })
                .catch(function (errorObject) {
                  console.log('Error fetching image')
                  console.log(errorObject)
                  // This is NOT reported as the most likely reason for this error to be triggered is a cross origin configuration issue
                  return {
                    success: 0
                  }
                })
            },
            uploadByFile (file) {
              const imageID = window.db.collection('CMSImages').doc().id
              return window.storage
                .ref()
                .child(`CMSImages/${imageID}`)
                .put(file)
                .then(function (ImageSnapshot) {
                  console.log('Uploaded file')
                  console.log(ImageSnapshot)
                  return ImageSnapshot.ref
                    .getDownloadURL()
                    .then(function (url) {
                      const imageUrl = url.split('&token')[0]
                      console.log(`Got image URL: ${imageUrl}`)
                      return {
                        success: 1,
                        file: {
                          url: imageUrl
                        }
                      }
                    })
                    .catch(function (errorObject) {
                      console.log('Error getting file url')
                      console.log(errorObject)
                      return {
                        success: 0
                      }
                    })
                })
                .catch(function (errorObject) {
                  console.log('Error uploading file')
                  console.log(errorObject)
                  return {
                    success: 0
                  }
                })
            }
          }
        }
      },
      checklist: {
        class: Checklist,
        inlineToolbar: true
      },
      list: {
        class: List,
        inlineToolbar: true
      },
      embed: {
        class: Embed,
        inlineToolbar: true
      },
      quote: {
        class: Quote,
        inlineToolbar: true,
        shortcut: 'CMD+SHIFT+O',
        config: {
          quotePlaceholder: 'Enter a quote',
          captionPlaceholder: "Quote's author"
        }
      }
    }
  })
  console.log(adminCMSPagesEditor)
}

async function cmsPagesLoad () {
  if (!window.db) {
    console.log('DB not ready yet, unable to load pages')
    $('body').on('dbLoaded', function () {
      console.log('DB Loaded, loading cms pages')
      cmsPagesLoad()
    })
    return
  }

  console.log('Loading cms pages')
  const cmsPageDocs = await window.db.collection('cmsPages').get()
  const cmsPages = []
  cmsPageDocs.forEach(function (cmsPageDoc) {
    const cmsPage = cmsPageDoc.data()
    cmsPage.id = cmsPageDoc.id
    cmsPages.push(cmsPage)
  })

  console.log(cmsPages)

  console.log('Loading jsGrid')
  $('#cmsPagesJSGrid').jsGrid({
    height: 'auto',
    width: '100%',

    sorting: true,
    filtering: true,
    paging: true,

    rowClick: function (args) {
      console.log('jsGrid row click')
      console.log(args)
      window.router.navigate(
        window.router.generate('cmsPage.edit', { pageId: args.item.id })
      )
    },
    onPageChanged: function (args) {
      console.log('jsGrid Page changed')
      // loadItemImages()
    },
    onOptionChanged: function (args) {
      console.log('jsGrid On options changed')
      // loadItemImages()
    },
    fields: [
      { title: 'ID', name: 'id', type: 'text', width: 150 },
      { title: 'slug', name: 'slug', type: 'text', width: 150 },
      { title: 'Title', name: 'title', type: 'text', width: 150 },
      { title: 'Sub title', name: 'subTitle', type: 'text', width: 150 },
      {
        title: 'Public',
        name: 'public',
        type: 'checkbox',
        width: 50,
        filtercss: 'itemsjsGridActiveCheckbox'
      }
    ],
    controller: {
      data: cmsPages,
      loadData: function (filter) {
        console.log('Loading data')
        console.log(filter)
        let filteredItems = $.grep(cmsPages, function (cmsPage) {
          if (typeof filter.public === 'boolean') {
            if (filter.public !== cmsPage.public) {
              return false
            }
          }
          return true
        })

        if (filter.id) {
          const idFilterFuse = new Fuse(filteredItems, {
            keys: ['id']
          })
          filteredItems = idFilterFuse.search(filter.id).map(function (item) {
            return item.item
          })
        }

        if (filter.name) {
          const nameFilterFuse = new Fuse(filteredItems, {
            keys: ['name']
          })
          filteredItems = nameFilterFuse
            .search(filter.name)
            .map(function (item) {
              return item.item
            })
        }

        if (filter.slug) {
          const slugFilterFuse = new Fuse(filteredItems, {
            keys: ['slug']
          })
          filteredItems = slugFilterFuse
            .search(filter.slug)
            .map(function (item) {
              return item.item
            })
        }

        if (filter.title) {
          const titleFilterFuse = new Fuse(filteredItems, {
            keys: ['title']
          })
          filteredItems = titleFilterFuse
            .search(filter.title)
            .map(function (item) {
              return item.item
            })
        }

        if (filter.subTitle) {
          const subTitleFilterFuse = new Fuse(filteredItems, {
            keys: ['subTitle']
          })
          filteredItems = subTitleFilterFuse
            .search(filter.subTitle)
            .map(function (item) {
              return item.item
            })
        }

        return filteredItems
      }
    }
  })
  $('#cmsPagesJSGrid').jsGrid('search')
}

export { cmsPagesLoad, cmsPageLoadEdit }
