function RenderCMSPage() {
	CMSPage=CMSPageDoc.data();
	CMSPage.id=CMSPageDoc.id;
	CMSPage.Content=CMSPageDoc.data().Content;

	if (typeof(CMSPage.Content)=="string") {
        	CMSPage.Content=JSON.parse(CMSPage.Content);
        };


	console.log("Rendering CMS page");

	TemplateCMSPage=$('#TemplateCMSPage').html();
	CompiledTemplateCMSPage=Template7.compile(TemplateCMSPage);
	$('#CMSPageDiv').html(CompiledTemplateCMSPage(CMSPage));

	$('#CMSPageTitle').html(CMSPage.Title);
	$('#CMSPageSubTitle').html(CMSPage.SubTitle);
};
