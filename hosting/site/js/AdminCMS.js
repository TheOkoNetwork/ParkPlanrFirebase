var cmsPageDoc

function initadminCMSPagesPage (cmsPageDoc) { // eslint-disable-line no-unused-vars
  if (stateurl[3] !== 'New') {
    if (!cmsPageDoc) {
      var cmsPageDocID = stateurl[3]
      db.collection('cmsPages').doc(cmsPageDocID).get().then(function (cmsPage) {
        console.log(cmsPage)
        if (cmsPage.exists) {
          initadminCMSPagesPage(cmsPage)
        } else {
          load404()
        };
      }).catch(function (errorObject) {
        console.log('Error fetching existing CMS page')
        console.log(errorObject)
        genericError(errorObject, 'PPERCMSPGDF')
      })
      return
    };
  };

  console.log('Loading Editor.js')

  var cmsPageData
  if (cmsPageDoc) {
    cmsPageData = cmsPageDoc.data().Content
    if (typeof (cmsPageData) === 'string') {
      cmsPageData = JSON.parse(cmsPageData)
    };

    console.log('Loading CMS page data')
    console.log(cmsPageData)

    $('#adminCMSPagesTitle').val(cmsPageDoc.data().Title)
    $('#adminCMSPagesSubTitle').val(cmsPageDoc.data().SubTitle)
    $('#adminCMSPagesSLUG').val(cmsPageDoc.data().SLUG)
    $('#adminCMSPagesPageH1').text(cmsPageDoc.data().Title)
    $('#adminCMSPagesAddButton').hide()
    $('#adminCMSPagesSaveButton').show()
    $('#adminCMSPagesPublic-0').prop('checked', cmsPageDoc.data().Public)
  } else {
    cmsPageData = {}
    $('#adminCMSPagesAddButton').show()
    $('#adminCMSPagesSaveButton').hide()
  };
  window.adminCMSPagesEditor = new EditorJS({
    holder: 'adminCMSPagesEditorDiv',
    placeholder: 'Hello World!',
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
          endpoint: `${config.FirebaseFunctionsUrl}/EditorApiLinkFetch`
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
              }).then(function (file) {
                console.log('Fetched image')
                var uint = new Uint8Array(file.slice(0, 4))
                const bytes = []
                uint.forEach((byte) => {
                  bytes.push(byte.toString(16))
                })
                var hex = bytes.join('').toUpperCase()
                var filetype
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
                var imageID = db.collection('CMSImages').doc().id

                var metadata = {
                  contentType: filetype
                }

                return firebase.storage().ref().child(`CMSImages/${imageID}`).put(file, metadata).then(function (ImageSnapshot) {
                  console.log('Uploaded file')
                  console.log(ImageSnapshot)
                  return ImageSnapshot.ref.getDownloadURL().then(function (url) {
                    var imageUrl = url.split('&token')[0]
                    console.log(`Got image URL: ${imageUrl}`)
                    return {
                      success: 1,
                      file: {
                        url: imageUrl
                      }
                    }
                  }).catch(function (errorObject) {
                    console.log('Error getting file url')
                    console.log(errorObject)
                    genericError(errorObject, 'PPERCMSPGIMUGU')
                    return {
                      success: 0
                    }
                  })
                }).catch(function (errorObject) {
                  console.log('Error uploading file')
                  console.log(errorObject)
                  genericError(errorObject, 'PPERCMSPGIMUUP')
                  return {
                    success: 0
                  }
                })
              }).catch(function (errorObject) {
                console.log('Error fetching image')
                console.log(errorObject)
                // This is NOT reported as the most likely reason for this error to be triggered is a cross origin configuration issue
                return {
                  success: 0
                }
              })
            },
            uploadByFile (file) {
              var imageID = db.collection('CMSImages').doc().id
              return firebase.storage().ref().child(`CMSImages/${imageID}`).put(file).then(function (ImageSnapshot) {
                console.log('Uploaded file')
                console.log(ImageSnapshot)
                return ImageSnapshot.ref.getDownloadURL().then(function (url) {
                  var imageUrl = url.split('&token')[0]
                  console.log(`Got image URL: ${imageUrl}`)
                  return {
                    success: 1,
                    file: {
                      url: imageUrl
                    }
                  }
                }).catch(function (errorObject) {
                  console.log('Error getting file url')
                  console.log(errorObject)
                  genericError(errorObject, 'PPERCMSPGIMFGU')
                  return {
                    success: 0
                  }
                })
              }).catch(function (errorObject) {
                console.log('Error uploading file')
                console.log(errorObject)
                genericError(errorObject, 'PPERCMSPGIMFUP')
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
          captionPlaceholder: 'Quote\'s author'
        }
      }
    }
  })
};

function adminCMSPagesPageSave () { // eslint-disable-line no-unused-vars
  var pageTitle = $('#adminCMSPagesTitle').val()
  var pageSubTitle = $('#adminCMSPagesSubTitle').val()
  var pageSLUG = $('#adminCMSPagesSLUG').val()
  var pagePublic = $('#adminCMSPagesPublic-0').is(':checked')

  if (!pageTitle) {
    console.log('Title missing')
    return
  };
  if (!pageSLUG) {
    console.log('SLUG missing')
    return
  };

  console.log('Fetching page block')
  window.adminCMSPagesEditor.save().then(function (PageContent) {
    console.log(PageContent)
    if (stateurl[3] !== 'New') {
      cmsPageDoc = db.collection('cmsPages').doc(stateurl[3])
    } else {
      cmsPageDoc = db.collection('cmsPages').doc()
    };

    cmsPageDoc.set({
      Public: pagePublic,
      Content: JSON.stringify(PageContent),
      Title: pageTitle,
      SubTitle: pageSubTitle,
      SLUG: pageSLUG,
      LastEditedByUser: firebase.auth().currentUser.uid
    }, { merge: true }).then(function (result) {
      console.log(`Saved page with doc ID: ${cmsPageDoc.id}`)
      switchPage(`/Admin/CMS/Pages/${cmsPageDoc.id}`)
    }).catch((errorObject) => {
      console.log('DB Saving failed: ', errorObject)
      genericError(errorObject, 'PPERCMSPGSVD')
    })
  }).catch((errorObject) => {
    console.log('CMS Saving failed: ', errorObject)
    genericError(errorObject, 'PPERCMSPGSVEJ')
  })
};

function initadminCMSPages () { // eslint-disable-line no-unused-vars
  console.log('Loading CMS pages')

  db.collection('cmsPages').orderBy('SLUG', 'asc').get().then(function (cmsPageDocs) {
    var cmsPagesTableData = []

    var compiledTemplateadminCMSPageSLUG = Template7.compile($('#TemplateadminCMSPageSLUG').html())
    var compiledTemplateadminCMSPageEditButton = Template7.compile($('#TemplateadminCMSPageEditButton').html())
    var compiledTemplateadminCMSPageDeleteButton = Template7.compile($('#TemplateadminCMSPageDeleteButton').html())

    cmsPageDocs.forEach(function (cmsPageDoc) {
      var cmsPage = cmsPageDoc.data()
      var pagePublic
      cmsPage.id = cmsPageDoc.id
      console.log(cmsPage)
      if (cmsPage.Public) {
        pagePublic = 'Public'
      } else {
        pagePublic = 'Hidden'
      };

      var pageEditButton = compiledTemplateadminCMSPageEditButton(cmsPage)
      var pageDeleteButton = compiledTemplateadminCMSPageDeleteButton(cmsPage)

      var cmsPageTableRow = [
        compiledTemplateadminCMSPageSLUG(cmsPage),
        cmsPage.Title,
        pagePublic,
        pageEditButton,
        pageDeleteButton
      ]
      cmsPagesTableData.push(cmsPageTableRow)
    })

    $('#adminCMSPagesTable').DataTable({
      data: cmsPagesTableData
    })
  }).catch(function (errorObject) {
    genericError(errorObject, 'PPERADMPGSGET')
  })
};

function adminCMSPagesDelete (PageID, ConfirmDelete) { // eslint-disable-line no-unused-vars
  var cmsPage
  if (PageID) {
    db.collection('cmsPages').doc(PageID).get().then(function (cmsPageDoc) {
      cmsPage = cmsPageDoc.data()
      cmsPage.id = cmsPageDoc.id

      $('#adminCMSPagesDeleteModal').modal()
      $('#adminCMSPagesDeleteModal').data('PageID', PageID)
      $('#adminCMSPagesDeleteModalPageSLUG').text(cmsPage.SLUG)
      $('#adminCMSPagesDeleteModalPageTitle').text(cmsPage.Title)
      $('#adminCMSPagesDeleteModalPageSubTitle').text(cmsPage.SubTitle)
    }).catch(function (errorObject) {
      genericError(errorObject, 'PPERCMSADMDEL')
    })
    return
  };
  PageID = $('#adminCMSPagesDeleteModal').data('PageID')
  console.log(`Deleting page: ${PageID}`)

  db.collection('cmsPages').doc(PageID).delete().then(function () {
    console.log('Deleted page')
    $('#adminCMSPagesDeleteModal').modal('hide')
    switchPage('/Admin/CMS/Pages')
  }).catch(function (errorObject) {
    genericError(errorObject, 'PPERCMSADMDEL')
  })
};
