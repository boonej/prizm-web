/* Members Page */
var hoverLock = false;
var populatedGroups = [];
var hover = function() {
 $('tbody>tr').hover(function(){
    if (!hoverLock){
      $('tbody>tr').removeClass('hover');
      $(this).addClass('hover');
    }
  });
};

var setupPage = function(){
 var availableGroups = [];
 $('.group-menu ul li.cursor').each(function(){
   var name = $(this).attr('data-name');
   availableGroups.push(name);
 });
 availableGroups.sort();

 var lastItem;
 for (var i = 0; i != availableGroups.length; ++i){
   var item = availableGroups[i];
   var count = 1;
   if (item == lastItem) {
     var lastElement =  $('#groupMenu ul li[data-name="' + item + '"] .group-count');
     count = Number(lastElement.text()) + 1;
     lastElement.text(count);
   } else {
     var element = document.createElement('li');
     element.appendChild(document.createTextNode('#' + item));
     var countSpan = document.createElement('span');
     countSpan.className = 'group-count';
     countSpan.appendChild(document.createTextNode(count));
     element.appendChild(countSpan);
     var a = document.createAttribute('data-name');
     a.value = item;
     element.onclick = function(e){
       var name = ($(e.target).attr('data-name'));
       $('#active-members tbody tr').each(function(){
         var row = $(this);
         var keep = false;
         row.children().children().children('.group-menu').children('ul').children('li').each(function(){
           var gname = $(this).attr('data-name');
           if (gname == name) {
             keep = true;
           }
         });
         if (keep) {
           row.removeClass('hidden');
         } else {
           row.addClass('hidden');
         }
         $('#groupMenu').addClass('hidden');
       });
     };
     element.setAttributeNode(a);
     var list = document.getElementById('groupMenuList');
     list.appendChild(element);
     lastItem = item;
   }
 }
 $('.group-menu li').click(function(){
    var $this = $(this);
    var group = $this.children('.group-icon').attr('group');
    $this.parents('.group-button').children('div.group-icon').attr('group', group);
  });
  $('.restrict-menu li').click(function(){
    var $this = $(this);
    var action = $(this).attr('action');
    $this.parent().toggleClass('hidden');
    $this.parent().siblings('.' + action).toggleClass('hidden');
  });
};

var orgID = $('#organization').val(); 

var csv = {
  showModal: function(){
    $.ajax({
      type: 'GET',
      url: '/profile/members/csv'
    })
    .done(function(html){
      $('body').prepend(html);
      $('#newCSV').submit(csv.submitForm);
      $('.checkboxes label').click(csv.handleSelection);
    });

  },
  submitForm: function(){
    var form = $('#newCSV').serialize();
    window.location.href = '/profile/members/memberexport.csv?' + form;
    modal.cancel();
    return false;
  },
  handleSelection: function(){
    var $this = $(this);
    if ($this.attr('for') == 'all') {
      $('input#all').siblings('input').attr('checked', false);
    } else {
      $('input#all').attr('checked', false);
    }
  }
};

var members = {
  // Member Action Methods
  renderCSVModal: function(){
    $.ajax({
      type: 'GET',
      url: '/profile/members/csv'
    })
    .done(function(html){
      $('body').prepend(html);
    });
  },
  formatTable: function(height) {
    var table = $('table');
      table.attr('org-width', table.width());
      table.find('tbody tr').each(function(){
        $(this).attr('org-width', $(this).width());
        $(this).attr('org-height', $(this).height() );
      }); 
      table.find('thead tr th').each(function(){
        $(this).attr('org-width', $(this).width() + 20);
        $(this).attr('org-height', $(this).height());
      });
      table.find('tbody tr td').each(function(){
        $(this).attr('org-width', $(this).width() + 20);
        $(this).attr('org-height', $(this).height());
      });
      $('table thead tr').css('display', 'block');
      $('tbody').css('display', 'block');
      //$('tbody tr').css('display', 'block');
      $('tbody').css('max-height', '606px');
      $('tbody').css('width', '100%');
      table.find('tbody tr').each(function(){
        $(this).css('width', $(this).attr('org-width') + 'px');
        $(this).css('height', $(this).attr('org-height') + 'px');
        $(this).css('padding', '16px 0px 16px 0px');
      });
      table.css('width', table.attr('org-width') + 'px');
      table.find('thead tr th').each(function(){
        $(this).css('width', $(this).attr('org-width') + 'px');
        $(this).css('padding', '0');
      });
      table.find('tbody tr td').each(function(){
        $(this).css('width', $(this).attr('org-width') + 'px');
      });

               },

  approve: function(e) {
    var member_id = $(e.target).parent('td').attr('data');
    var organization = $('#organization').attr('data');
    $.ajax({
      type: 'POST',
      url: '/users/' + member_id,
      headers:{
        'Accept': 'application/json',
        'org': organization,
        'status': 'active',
        'action': 'updateOrgStatus'
      },
      success: function() {
        members.pendingTab();
        members.updateActiveCount();
        members.updatePendingCount();
      }
    });
  },
  reject: function(e) {
    var member_id = $(e.target).parents('td').attr('data');
    var organization = $('#organization').attr('data');
    $.ajax({
      type: 'POST',
      url: '/users/' + member_id,
      headers:{
        'Accept': 'application/json',
        'org': organization,
        'status': 'inactive',
        'action': 'updateOrgStatus'
      },
      success: function() {
        members.pendingTab();
        members.updatePendingCount();
      }
    });
  },
  remove: function(e) {
    var member_id = $(e.target).parents('td').attr('data');
    var organization = $('#organization').attr('data');
    $.ajax({
      type: 'POST',
      url: '/users/' + member_id,
      headers:{
        'Accept': 'application/json',
        'org': organization,
        'status': 'inactive',
        'action': 'updateOrgStatus'
      },
      success: function() {
        members.activeTab();
        members.updateActiveCount();
      }
    });
  },

  makeAmbassador: function(e) {
    var member_id     = $(e.target).parents('td').attr('data');
    var organization  = $('#organization').attr('data');

    $.ajax({
      type: 'POST',
      url: '/users/' + member_id,
      headers:{
        'Accept': 'application/json',
        'memberType': 'ambassador',
        'action': 'updateSubtype',
        'org': organization
      },
      success: function() {
        members.activeTab();
        hoverLock = false;
      },
      error: function(jqXHR) {
        console.log(jqXHR.responseText);
      }
    });
  },

  makeLuminary: function(e) {
    var member_id     = $(e.target).parents('td').attr('data');
    var organization  = $('#organization').attr('data');

    $.ajax({
      type: 'POST',
      url: '/users/' + member_id,
      headers:{
        'Accept': 'application/json',
        'memberType': 'luminary',
        'action': 'updateSubtype',
        'org': organization
      },
      success: function() {
        members.activeTab();
      },
      error: function(jqXHR) {
        console.log(jqXHR.responseText);
      }
    });
  },

  promoteUser: function(id, role){
    var member_id     = id; 
    var organization  = $('#organization').attr('data');
    $.ajax({
      type: 'POST',
      url: '/users/' + id,
      headers:{
        'Accept': 'application/json',
        'memberType': role,
        'action': 'updateSubtype',
        'org': organization
      },
      success: function() {
        members.activeTab();
      },
      error: function(jqXHR) {
        console.log(jqXHR.responseText);
      }
    });


  },

  makeMember: function(e) {
    var member_id     = $(e.target).parents('td').attr('data');
    var organization  = $('#organization').attr('data');

    $.ajax({
      type: 'POST',
      url: '/users/' + member_id,
      headers:{
        'Accept': 'application/json',
        'memberType': 'null',
        'action': 'updateSubtype',
        'org': organization
      },
      success: function(response) {
        members.activeTab();
      },
      error: function(jqXHR) {
        console.log(jqXHR.responseText);
      }
    });
  },
  toggleGroupMenu: function(e){
    var target = e.target;
    var isTarget = $(target).children('.group-menu').length > 0;
    if (!isTarget) {
      target = $(target).parent();
    }
    var targetHidden = $(target).children('.group-menu').hasClass('hidden');
    $(target).toggleClass('selected');
    $('.remove-menu').addClass('hidden');
    $('.restrict-menu').addClass('hidden');
    if (targetHidden) {
      $('.group-menu').addClass('hidden');
      //$(target).children('.group-menu').css('top', $(target).offset().top - 64 );
      $('tbody').css('overflow', 'hidden');
      $(target).children('.group-menu').toggleClass('hidden');
    } else {
      $('tbody').css('overflow', 'auto');
      $(target).children('.group-menu').toggleClass('hidden');
    }


                   },
  toggleAmbassadorMenu: function(e) {
    var target = e.target;
    var targetHidden = $(target).children('.ambassador-menu').hasClass('hidden');

    $(target).toggleClass('selected');
    $('.remove-menu').addClass('hidden');
    $('.restrict-menu').addClass('hidden');

    if (targetHidden) {
      $('.ambassador-menu').addClass('hidden');
      $(target).children('.ambassador-menu').toggleClass('hidden');
      //$(target).children('.ambassador-menu').css('top', $(target).offset().top - 50 );
      $('.table tbody').css('overflow', 'hidden');
    }
    else {
      $(target).children('.ambassador-menu').toggleClass('hidden');
      $('.table tbody').css('overflow', 'auto');
    }
  },

  toggleRestrictMenu: function(e) {
    var target = e.target;
    var targetHidden = $(target).children('.restrict-menu').hasClass('hidden');
    
    $('.remove-menu').addClass('hidden');
    $('.ambassador-menu').addClass('hidden');

    if (targetHidden) {
      console.log('restrict was hidden - showing now');
      $('.restrict-menu').addClass('hidden');
      //$(target).children('.restrict-menu').css('top', $(target).offset().top - 75 );
      $(target).children('.restrict-menu').removeClass('hidden');
      $('tbody').css('overflow', 'hidden');
    }
    else {
      if ($(target).is('.restrict-menu')) {
        console.log('restrict was visable - hiding now');
        $('.restrict-menu').addClass('hidden');
        $('tbody').css('overflow', 'auto');
      }
    }
  },

  toggleRemoveMenu: function(e) {
    var target = e.target;
    var targetHidden = $(target).children('.remove-menu').hasClass('hidden');
    
    $('.restrict-menu').addClass('hidden');
    $('.ambassador-menu').addClass('hidden');

    if (targetHidden) {
      $('.remove-menu').addClass('hidden');
      //$(target).children('.remove-menu').css('top', $(target).offset().top - 75 );
      $('tbody').css('overflow', 'hidden');
      $(target).children('.remove-menu').toggleClass('hidden');
    }
    else {
      $(target).children('.remove-menu').toggleClass('hidden');
      $('tbody').css('overflow', 'auto');
    }

  },

  cancelRemoveMenu: function() {
    $('.remove-menu').addClass('hidden');
    $('tbody').css('overflow', 'auto');
  },

  showCard: function(e) {
    var member_id = $(e.target).parents('td').attr('data');
    var member_selector = '.member-card[data=' + member_id + ']';
    var target = $(member_selector);
    $('.member-card').addClass('hidden');
    target.removeClass('hidden');
    $('#memberCard').modal();
  },

  // Table Controls
  addMember: function() {
    return false;
  },

  exportCSV: function(e) {
    return false;
  },

  // Member Page Controls
  activeTab: function(sort, text) {
    if(!sort) sort = false;
    if(!text) text = '';
    var organization = $('#organization').attr('data');
    var request = $.ajax({
      type: 'GET',
      url: '/organizations/' + organization + '/members',
      headers: {
        'Accept': 'application/jade',
        'memberStatus': 'active',
        'content-type': 'application/jade',
        'org': organization,
        'sort': sort,
        'text': text
      },
      success: function(html) {
        $('#selectedTab').val('active');
        if (html) {
          $('#active-members').html(html);
        }
        members.updateActiveCount(sort);
        $('#pending-members').hide();
        $('#active-members').fadeIn();
        hover();

        setupPage();
        //members.formatTable('606px');

      }
    });  
  },

  pendingTab: function(sort, text) {
    if(!sort) sort = false;
    if(!text) text = '';
    var organization = $('#organization').attr('data');
    var request = $.ajax({
      type: 'GET',
      url: '/organizations/' + organization + '/members',
      headers: {
        'Accept': 'application/jade',
        'memberStatus': 'pending',
        'content-type': 'application/jade',
        'org': organization,
        'sort': sort,
        'text': text
      },
      success: function(html) {
        $('#selectedTab').val('pending');
        members.updatePendingCount();
        if (html) {
          $('#pending-members').html(html);
        }
        $('#active-members').hide();
        $('#pending-members').fadeIn();
        hover();
        //members.formatTable('606px');
      }
    });
   },

  updateActiveCount: function(sort){
    var organization = $('#organization').attr('data');
    $.ajax({
      type: 'GET',
      url: '/organizations/' + orgID + '/members',
      headers: {
        'Accept': 'application/json',
        'content-type': 'application/json',
        'memberStatus': 'active',
        'org': organization,
        sort: sort
      },
      success: function(json) {
        $('a[href="#active"]').text("Approved Members (" + json.length + ")");
      }
    })
  },

  updatePendingCount: function(){
    var organization = $('#organization').attr('data');
    $.ajax({
      type: 'GET',
      url: '/organizations/' + orgID + '/members',
      headers: {
        'Accept': 'application/json',
        'content-type': 'application/json',
        'memberStatus': 'pending',
        'org': organization
      },
      success: function(json) {
        var count = json.length;
        $('a[href="#pending"]').text("Pending Approval (" + count + ")");
      }
    })
  },

  // Member Card Methods
  showCardBack: function(){
    $('.front-member').addClass('hidden');
    $('.back-member').removeClass('hidden');
  },
  showCardFront: function(){
    $('.back-member').addClass('hidden');
    $('.front-member').removeClass('hidden'); 
  },
  showNameMenu: function(){
    $('#nameMenu').toggleClass('hidden');
  },
  showStatusMenu: function(){
    $('#statusMenu').toggleClass('hidden');
  },
  showDateMenu: function(){
    $('#dateMenu').toggleClass('hidden');
  },
  showGroupsMenu: function(){
    $('#groupMenu').toggleClass('hidden');
  },
  search: function(e){
    var target = e.target;
    var text = $(target).val();
    if ($('#selectedTab').val() == 'active'){
      members.activeTab(false, text);
    } else {
      members.pendingTab(false, text);
    }
  },
  restrict: function(user){
    $.ajax({
      type: 'POST',
      url: '/users/restrict',
      headers:{
        'Content-type': 'application/json',
        'Accept': 'application/json',
        'id': user
      },
      success: function() {
        members.activeTab();
        members.updatePendingCount();
      }
    });
  },
  unrestrict: function(user){
    $.ajax({
      type: 'POST',
      url: '/users/unrestrict',
      headers:{
        'Content-type': 'application/json',
        'Accept': 'application/json',
        'id': user
      },
      success: function() {
        members.activeTab();
        members.updatePendingCount();
      }
    });
  },
  showGroup: function(organization, group){
    $.ajax({
      type: 'GET',
      url: '/messages',
      headers: {group: group},
      success: function(html){
        var state = {members: 'messages'};
        history.pushState(state, 'messages', 'messages');
        document.open();
        document.write(html);
        document.close();
      }
    });
  }
};


$(function(){
  // Get Active and Pending Tab Counts
  members.updateActiveCount();
  members.updatePendingCount();
  // Find currently displayed member card and toggle hidden class when 
  // modal is dismissed
  $('#memberCard').on('click', '.modal-backdrop', function() {
    $('.member-card').not('hidden').addClass('hidden');
  });
  $(document).mouseup(function(e) {
    // Hack to dimiss menus unless menu is clicked.
    var ambassadorMenu  = '.member-type';
    var restrictMenu    = '.member-action.restrict';
    var removeMenu      = '.member-action.remove';
    var groupButton     = '.group-button';
    var restrictItem    = '.member-action.restrict li';
    var restrictButton  = '.member-action.restrict .btn';
    var groupItem = '.groupHeader';
    var target          = e.target;

    if ($(target).is(ambassadorMenu)) {
      $('.remove-menu').addClass('hidden');
      $('.restrict-menu').addClass('hidden');
      hoverLock = !hoverLock;      
    } else if ($(target).is(groupItem)){

    }
    else if($(target).is(restrictItem)) {
      //alert('restrict');
    } else if ($(target).is(restrictButton)){
      $(target).parents('.restrict-menu').children('div').addClass('hidden');
      $(target).parents('.restrict-menu').children('ul').removeClass('hidden');
      $(target).parents('.restrict-menu').addClass('hidden');
    }
    else if ($(target).is(restrictMenu)) {
      $('.remove-menu').addClass('hidden');
      $('.ambassador-menu').addClass('hidden');
      $('.member-type').removeClass('selected');
      hoverLock = !hoverLock;
    }
    else if ($(target).is(removeMenu)) {
      $('.restrict-menu').addClass('hidden');
      $('.ambassador-menu').addClass('hidden');
      $('.member-type').removeClass('selected');
      hoverLock = !hoverLock;
    }
    else if ($(target).is(groupButton)) {
      $('.restrict-menu').addClass('hidden');
      $('.ambassador-menu').addClass('hidden');
      $('.member-type').removeClass('selected');
      hoverLock = !hoverLock;
    }
    else {
      $('#dateMenu').addClass('hidden');
      $('#nameMenu').addClass('hidden');
      $('#statusMenu').addClass('hidden');
      $('#groupMenu').addClass('hidden');
      $('.remove-menu').addClass('hidden');
      $('.restrict-menu').addClass('hidden');
      $('.ambassador-menu').addClass('hidden');
      $('.member-type').removeClass('selected');    
      $('.group-menu').removeClass('selected');
      $('.group-menu').addClass('hidden');
      hoverLock = false;
    }
    $('tbody').css('overflow', 'auto'); 
  })
});

$(document).ready(function(){
  // members.formatTable('606px');
  setupPage(); 
  hover(); 
});

