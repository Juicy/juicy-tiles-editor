
    (function () {
      /**
       * Returns an array of descendant elements that match the given tag names.
       * Tests: http://jsfiddle.net/tomalec/3u2CM/5/
       */
      function getFirstLevelChildTags(baseElement, tagNames) {
        var tagNo = tagNames.length;
        var children = [];
        var elements;
        while( tagNo-- ){
          elements = baseElement.getElementsByTagName(tagNames[ tagNo ]);
          elementLoop: for (var i = 0, ilen = elements.length; i < ilen; i++) {
            var elem = elements[i].parentNode;
            while (elem != baseElement) {
              if ( tagNames.indexOf(elem.nodeName )> -1 ) {
                continue elementLoop;
              }
              elem = elem.parentNode;
            }
            children.push(elements[i]);
          }
        }
        return children;
      }

      Polymer('juicy-tile-editor', {
        selectionMode: false,
        editedElement: null,
        highlightedElement: null,
        selectedItems: [],
        selectedElements: [],
        sortableTilesModel: null,
        mouseOverListener: null,
        mouseOutListener: null,
        mouseupListener: null,
        contextMenuListener: null,
        keyUpListener: null,
        tree: [],
        watchedTagNames: ["JUICY-TILE-LIST"],
        attached: function () {
          this.$.elementEdited.show(this.selectedElements.length ? this.selectedElements[0] : null);

          var that = this;
          this.$.treeView.toDisplayName = function(branch) {
            if(branch.node) { //juicy-tile-list root
              return branch.node.id;
            }
            else if (branch.name != void 0) { //container
              return branch.name;
            }
            else if (branch.index != void 0) { //element
              var txt = "";
              var elem = that.editedTiles.elements[ branch.index];
              var header = elem.querySelector("h1, h2, h3, h4, h5, h6");
              if(header) {
                txt = header.textContent;
              }
              else {
                txt = elem.textContent;
              }
              txt = txt.trim();
              if(!txt) {
                txt = "<" + elem.nodeName.toLowerCase() + ">";
              }
              if(txt.length > 23) {
                txt = txt.substr(0, 20) + " \u2026"; //'HORIZONTAL ELLIPSIS' (U+2026)
              }
              return txt;
            }
            else { //error
              return "Unnamed element"
            }
          }
        },
        detached: function () {
          this.$.elementEdited.hide();
          this.$.elementRollover.hide();
          this.$.elementSelected.hide();
          this.selectionMode = false;
          this.unlisten(); //changing property in "detached" callback does not execute "selectionModeChanged" (Polymer 0.2.3)
        },
        selectionModeChanged: function() {
          if (this.selectionMode) {
            this.listen();
          }
          else {
            this.unlisten();
          }
        },
        getSortableElement: function (elem) {
          while (elem.parentNode) {
            if (this.watchedTagNames.indexOf( elem.parentNode.nodeName ) > -1 ) {
              return elem;
            }
            elem = elem.parentNode;
          }
        },
        listen: function () {
          this.mouseOverListener = function (ev) {
            this.highlightedElement = null;
            var highlightedElement = this.getSortableElement(ev.target);
            if (highlightedElement) {
              if (this.highlightedElement !== highlightedElement) {
                this.highlightedElement = highlightedElement;
                this.$.elementRollover.show(this.highlightedElement);
              }
            }
          }.bind(this);

          this.mouseOutListener = function (ev) {
            this.$.elementRollover.hide();
          }.bind(this);

          this.mouseupListener = function (ev) {
            if (this.highlightedElement) {
              var model = this.highlightedElement.parentNode;
              this.treeRefresh();
              // ??? cantWe simply use editedElement?
              var highlightedItem = model.items[ model.elements.indexOf(this.highlightedElement) ];
              if (ev.ctrlKey || ev.metaKey || ev.shiftKey) {
                if(this.editedTiles == model) {
                  //expand group
                  var index = this.selectedItems.indexOf(highlightedItem);
                  if(index == -1) {
                    this.treeHighlightExtendAction(highlightedItem);
                    this.$.treeView.highlightBranch(highlightedItem, true);
                  }
                  else {
                    this.treeHighlightRemoveAction(highlightedItem);
                    this.$.treeView.unhighlightBranch(highlightedItem);
                  }
                }
              }
              else {
                this.treeHighlightAction(highlightedItem, model);
                this.$.treeView.highlightBranch(highlightedItem);
              }
              ev.preventDefault();
              ev.stopImmediatePropagation();
            }
          }.bind(this);

          this.clickListener = function (ev) {
            var sortableElement = this.getSortableElement(ev.target);
            if(sortableElement) {
              ev.preventDefault();
              ev.stopImmediatePropagation();
            }
          }.bind(this);

          this.contextMenuListener = function (ev) {
            if (ev.ctrlKey) {
              ev.preventDefault(); //on Mac, CTRL+Click opens system context menu, which we would like to avoid
            }
          }.bind(this);

          this.keyUpListener = function (ev) {
            if (ev.ctrlKey || ev.metaKey) { //mind that CTRL+T, CTRL+N, CTRL+W cannot be captured in Chrome
              if (ev.keyCode == 71) { //CTRL+G
                this.newGroupFromSelection();
                ev.preventDefault();
              }
              else if (ev.keyCode == 77) { //CTRL+M
                this.moveSelectionToEditedItemContainer();
                ev.preventDefault();
              }
              else if (ev.keyCode == 85) { //CTRL+U
                //TODO ungroup selection
              }
            }
          }.bind(this);

          window.addEventListener('mouseover', this.mouseOverListener);
          window.addEventListener('mouseout', this.mouseOutListener);
          window.addEventListener('mouseup', this.mouseupListener, true);
          window.addEventListener('mousedown', this.clickListener, true);
          window.addEventListener('click', this.clickListener, true);
          window.addEventListener('contextmenu', this.contextMenuListener);
          window.addEventListener('keyup', this.keyUpListener);
        },
        unlisten: function () {
          window.removeEventListener('mouseover', this.mouseOverListener);
          window.removeEventListener('mouseout', this.mouseOutListener);
          window.removeEventListener('mouseup', this.mouseupListener, true);
          window.removeEventListener('mousedown', this.clickListener, true);
          window.removeEventListener('click', this.clickListener, true);
          window.removeEventListener('contextmenu', this.contextMenuListener);
          window.removeEventListener('keyup', this.keyUpListener);
        },
        toggleSelectionMode: function () {
          this.selectionMode = !this.selectionMode;
        },
        getItemElement: function (item) {
        	//FIXME I may not work (tomalec)
          var model = this.editedTiles;
          if (item.name) {
            if (item.name === "root") {
              return model.$.container;
            }
            else {
              return model.elements[item.name];
            }
          }
          else {
            return model.elements[item.index];
          }
        },
        revertAction: function() {
          this.selectedItems.length = 0; //TODO solve this better (put changes on a stack?). Currently I need to clear selection because `this.editedTiles.loadFromStorage()` recreates `setup`, which results in `this.selectedItems` pointing to objects that are not referenced anymore [Marcin]
          this.$.elementEdited.show();
          this.$.elementRollover.hide();
          this.$.elementSelected.hide();
          this.treeChangedAction();
        },
        treeHighlightAction: function (item, tiles) {
          if(item.detail) {  //is tree event
            tiles = item.detail.tiles;
            item = item.detail.branch;
          }
          this.editedTiles = tiles;
          var element = this.getItemElement(item);
          this.$.elementEdited.show(element);
          this.selectedItems.length = 0;
          this.selectedItems.push(item);
          this.selectedElements.length = 0;
          this.selectedElements.push(element);
        },
        /**
         * [treeRefresh description]
         * @return {[type]} [description]
         */
        // tree: [
        // 	{
        // 		node: _juicy-tile-list_,
        // 		setup: _PackageSetup_, // redundand consider removal
        // 		branches: [
        // 			_setup.items[?].index_: [
        // 				_tree_,
        // 				_tree_
        // 			]
        // 		]
        // 	}
        // ]
        treeRefresh: function() {
          var that = this,
          	  tree = [];
          var extendWithSubTiles = function (element, parentJuicyTile) {
            var nested,
            	branches = [];

            // iterate on element's real DOM elements
            for (var childNo = 0, eLen = element.elements.length; childNo < eLen; childNo++) {
              if ( that.watchedTagNames.indexOf( element.elements[childNo].nodeName ) > -1 ) { //element is directly a nested tiles
                nested = [element.elements[childNo]]
              }
              else { //check if element has nested tiles children
                nested = getFirstLevelChildTags(element.elements[childNo], that.watchedTagNames);
              }
            	// iterate on nested juicy-tile-list
            	if( nested.length ){
            		branches[ childNo ] = [];

	            	for(var branchNo = 0, bLen = nested.length; branchNo < bLen; branchNo++){
	            		branches[ childNo ].push(
	            			extendWithSubTiles(
	            				nested[branchNo],
	            				element.elements[childNo]
	            			)
	            		);
	            	}
	            }
            }

            return {
            	node: element,
            	setup: element.setup, // redundand consider removal
            	branches: branches
            }
          }

          //find all trees
          var topmost = this;
          while (topmost.parentNode) {
            topmost = topmost.parentNode;
          }

          var models = getFirstLevelChildTags(topmost, this.watchedTagNames);

          if (topmost.host) {
            var distributedModels = getFirstLevelChildTags(topmost.host, this.watchedTagNames);
            models = models.concat(distributedModels);
          }

          for (var i = 0, ilen = models.length; i < ilen; i++) {
            tree.push(
              extendWithSubTiles(models[i])
            );
          }
          // notify observer/two-way-binding/tempalte only once
          this.tree = tree;
        },
        treeHighlightExtendAction: function(item) {
          if(item.detail) {  //is tree event
            item = item.detail.branch;
          }
          this.selectedItems.push(item);
          var elem = this.editedTiles.elements[item.name || item.index];
          this.selectedElements.push(elem);
          this.$.elementSelected.show(this.selectedElements);
        },
        treeHighlightRemoveAction: function(item) {
          if(item.detail) {  //is tree event
            item = item.detail.branch;
          }
          var index = this.selectedItems.indexOf(item);
          this.selectedItems.splice(index, 1);
          this.selectedElements.splice(index, 1);
          this.$.elementSelected.show(this.selectedElements);
        },
        treeChangedAction: function() {
          this.treeRefresh();
          this.$.treeView.highlightBranch(this.selectedItems);
        }
      });
    })();