function renderCMSPage () { // eslint-disable-line no-unused-vars
  var cmsPage = cmsPageDoc.data()
  cmsPage.id = cmsPageDoc.id
  cmsPage.Content = cmsPageDoc.data().Content

  if (typeof (cmsPage.Content) === 'string') {
    cmsPage.Content = JSON.parse(cmsPage.Content)
  };

  console.log('Rendering CMS page')

  var CompiledTemplateCMSPage = Template7.compile($('#TemplateCMSPage').html())
  $('#CMSPageDiv').html(CompiledTemplateCMSPage(cmsPage))

  $('#CMSPageTitle').html(cmsPage.Title)
  $('#CMSPageSubTitle').html(cmsPage.SubTitle)
};
