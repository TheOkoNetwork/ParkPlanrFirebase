function renderCMSPage () { // eslint-disable-line no-unused-vars
  var cmsPage = cmsPageDoc.data()
  cmsPage.id = cmsPageDoc.id
  cmsPage.content = cmsPageDoc.data().content

  if (typeof (cmsPage.content) === 'string') {
    cmsPage.content = JSON.parse(cmsPage.content)
  };

  console.log('Rendering CMS page')

  var CompiledTemplateCMSPage = Template7.compile($('#TemplateCMSPage').html())
  $('#CMSPageDiv').html(CompiledTemplateCMSPage(cmsPage))

  $('#CMSPageTitle').html(cmsPage.title)
  $('#CMSPageSubTitle').html(cmsPage.subTitle)
};
