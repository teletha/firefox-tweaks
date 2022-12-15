// ==UserScript==
// @name          ClearSeachTerm.uc.js
// @description		Clear the search box and restore the search engine.
// @include       main
// @charset			  utf-8
// ==/UserScript==
(function(){
	const afterSearch = true;
	const doubleClick = true;
	
	const searchbar = BrowserSearch.searchBar;
	searchbar.doSearch_org = searchbar.doSearch;
	searchbar.doReset = function(){
  		searchbar.textbox.value = '';
  		Services.search.getVisibleEngines().then(function(engines){
  			Services.search.defaultEngine = engines[0];
  		})
	}
	searchbar.doSearch = function(aData, aWhere, aEngine, aParams, aOneOff){
  		this.doSearch_org(aData, aWhere, aEngine, aParams, aOneOff);
		if(afterSearch) this.doReset();
  	}
  	if(!doubleClick) return;
  	searchbar.ondblclick = function(e){
  		if(e.originalTarget.localName != 'hbox') return;
  		this.doReset();
  	}
})()
