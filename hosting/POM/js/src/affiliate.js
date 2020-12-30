const Fuse = require('fuse.js').default

const affiliateHome = async function (params) {
  console.log('Loading affiliate homepage')
}
const affiliateAdmin = async function (params) {
  if (!window.db) {
    console.log('DB not ready yet, unable to load admin affiliate list')
    $('body').on('dbLoaded', function () {
      console.log('DB Loaded, loading affiliateAdmin')
      affiliateAdmin(params)
    })
    return
  }

  console.log('Loading affiliate admin page')

  const affiliateDocs = await window.db.collection('affiliates').get()
  console.log(affiliateDocs)
  const affiliates = []
  affiliateDocs.forEach(function (affiliateDoc) {
    console.log(affiliateDoc.id, affiliateDoc.data())
    const affiliate = affiliateDoc.data()
    affiliate.id = affiliateDoc.id
    affiliates.push(affiliate)
  })

  $('#affiliatesJSGrid').jsGrid({
    height: 'auto',
    width: '100%',
    sorting: true,
    filtering: true,
    paging: true,

    rowClick: function (args) {
      console.log('jsGrid row click')
      console.log(args)
      window.router.navigate(
        window.router.generate('affiliate.admin.view', {
          affiliateId: args.item.id
        })
      )
    },
    onPageChanged: function (args) {
      console.log('jsGrid Page changed')
    },
    onOptionChanged: function (args) {
      console.log('jsGrid On options changed')
    },
    fields: [
      { title: 'ID', name: 'id', type: 'text', width: 100 },
      { title: 'Name', name: 'name', type: 'text', width: 150 },
      { title: 'Website', name: 'website', type: 'text', width: 150 },
      { title: 'Slug', name: 'slug', type: 'text', width: 100 }
    ],
    controller: {
      data: affiliates,
      loadData: function (filter) {
        console.log(Fuse)
        console.log('Loading data')
        console.log(filter)
        let filteredItems = affiliates

        if (filter.id) {
          const idFilterFuse = new Fuse(filteredItems, {
            keys: ['id']
          })
          filteredItems = idFilterFuse.search(filter.id).map(function (item) {
            return item.item
          })
        }
        console.log('Filtered by ID')
        console.log(filteredItems)

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
        console.log('Filtered by name')
        console.log(filteredItems)

        if (filter.website) {
          const websiteFilterFuse = new Fuse(filteredItems, {
            keys: ['website']
          })
          filteredItems = websiteFilterFuse
            .search(filter.website)
            .map(function (item) {
              return item.item
            })
        }
        console.log('Filtered by website')
        console.log(filteredItems)

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
        console.log('Filtered by slug')
        console.log(filteredItems)

        return filteredItems
      }
    }
  })
  $('#affiliatesJSGrid').jsGrid('search')
}
const affiliateAdminEdit = async function (params) {
  console.log('Loading affiliate admin, new/edit affiliate page')

  if (params) {
    console.log('Edit existing affiliate')
    $('.showIfAffiliateAdd').hide()
    $('.showIfAffiliateEdit').show()
  } else {
    console.log('New affiliate')
    $('.showIfAffiliateAdd').show()
    $('.showIfAffiliateEdit').hide()
  }

  $('#affiliateAdminEditSaveBtn').on('click', affiliateAdminEditSave)
}

const affiliateAdminView = async function (params) {
  if (!window.db) {
    console.log('DB not ready yet, unable to load admin view affiliate page')
    $('body').on('dbLoaded', function () {
      console.log('DB Loaded, loading affiliateAdminView')
      affiliateAdminView(params)
    })
    return
  }

  console.log('Loading affiliate admin, view affiliate page')
  console.log(params)
  const docPromises = [
    window.db.collection('affiliates').doc(params.affiliateId).get(),
    window.db
      .collection('affiliates')
      .doc(params.affiliateId)
      .collection('private')
      .doc('payment')
      .get()
  ]

  const promiseResults = await Promise.all(docPromises)
  console.log(promiseResults)
  promiseResults.forEach(function (promiseResult) {
    const refSplit = promiseResult.ref.path.split('/')
    switch (refSplit[refSplit.length - 2]) {
      case 'affiliates':
        console.log('Public doc')
        if (promiseResult.exists) {
          console.log(promiseResult.data())
          $('.affiliateAdminViewAffiliateName').text(promiseResult.data().name)
        } else {
          console.log('Affiliate does not exist')
        }
        break
      case 'private':
        console.log('Private doc')
        switch (refSplit[refSplit.length - 1]) {
          case 'payment':
            console.log('Payment doc')
            if (promiseResult.exists) {
              console.log(promiseResult.data())
              $('.affiliateAdminViewAffiliateAccrued').text(
                promiseResult.data().accrued ? promiseResult.data().accrued : 0
              )
            } else {
              console.log('Affiliate does not exist')
            }
            break
        }
        break
    }
  })
}

const affiliateAdminEditSave = async function () {
  console.log('Affiliate admin, new/edit affiliate save')
  const params = window.router._lastRouteResolved.params

  const formData = {}
  $($('#affiliateEditForm').serializeArray()).each(function (index, obj) {
    formData[obj.name] = obj.value
  })
  console.log(formData)

  const publicDocData = {
    name: formData.affiliateEditFieldName,
    website: formData.affiliateEditFieldWebsite,
    slug: formData.affiliateEditFieldSlug
  }
  const paymentDocData = {
    method: 'UK_BANK_TRANSFER',
    bankAccount: {
      name: formData.affiliateEditFieldPaymentName,
      sort: formData.affiliateEditFieldPaymentSort,
      account: formData.affiliateEditFieldPaymentAccount
    }
  }
  console.log(publicDocData)
  console.log(paymentDocData)
  if (!publicDocData.name || !publicDocData.website || !publicDocData.slug) {
    window.alert(
      'Please provide all fields in the basic information section, remembering to generate a unique slug'
    )
    return
  }
  switch (paymentDocData.method) {
    case 'UK_BANK_TRANSFER':
      if (
        !paymentDocData.bankAccount.name ||
        !paymentDocData.bankAccount.sort ||
        !paymentDocData.bankAccount.name
      ) {
        window.alert(
          'Please provide bank information or select another payment method'
        )
        return
      }
      break
  }

  let affiliatePublicDoc
  if (params) {
    console.log('Edit existing affiliate')
    affiliatePublicDoc = window.db
      .collection('affiliates')
      .doc(params.affiliateId)
  } else {
    console.log('New affiliate')
    affiliatePublicDoc = window.db.collection('affiliates').doc()
  }
  const affiliatePaymentDoc = window.db
    .collection('affiliates')
    .doc(affiliatePublicDoc.id)
    .collection('private')
    .doc('payment')

  console.log(affiliatePublicDoc)
  console.log(affiliatePaymentDoc)

  console.log('Creating batch')
  const batch = window.db.batch()
  console.log('Setting public doc')
  batch.set(affiliatePublicDoc, publicDocData)
  console.log('Setting payment doc')
  batch.set(affiliatePaymentDoc, paymentDocData)
  try {
    console.log('Comitting docs')
    await batch.commit()
    console.log('Comitted write')
    window.router.navigate(
      window.router.generate('affiliate.admin.view', {
        affiliateId: affiliatePublicDoc.id
      })
    )
  } catch (error) {
    console.log('Error writing affiliate docs')
    console.log(error)
    window.alert('Error writing affiliate docs')
  }
}

export {
  affiliateHome,
  affiliateAdmin,
  affiliateAdminEdit,
  affiliateAdminView
}
