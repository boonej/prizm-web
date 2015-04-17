$(document).ready(function(){
  $(document).mouseup(function(e){
    var container = $('.avatar-menu .user-menu');
    var toggleMenu = $('.tool-tip');
    if (!$(e.target).parents('.avatar-menu').length) {
      if (toggleMenu.hasClass('rotated')){
        if ($(window).width() > 500) {
          container.toggle();
        } else {
          container.slideToggle(); 
        }
        $('.tool-tip').toggleClass('rotated');
      } 
    }
    var settingsMenu = $('.settings .user-menu');
    var settingsToggle = $('.settings-tool-tip');
    if (!$(e.target).parents('.settings-avatar-menu').length){
      if (settingsToggle.hasClass('rotated')){
        if ($(window).width() > 500) {
          settingsMenu.toggle();
        } else {
          settingsMenu.slideToggle(); 
        }
        $('.settings-tool-tip').toggleClass('rotated');
      }
    } 
    var plusMenu = $('.plus-menu');
    if (!$(e.target).parents('.plus-menu').length ){
      plusMenu.addClass('hidden');
    }
  });
  $('.settings-menu li').mousedown(function(){
    $('.settings li').removeClass('selected');
    $(this).addClass('selected');
  });
  $('#new-post').submit(function(){
    var $form = $('#new-post');
    var post = $form.serialize();
    $.ajax({
      type: 'POST',
      url: '/posts',
      headers: {
    
      },
      data: post,
      success: function(response) {
        alert('success');
      },
      error: function(jqXHR) {
        alert('failure');
      }
    });
    return false;
  });
  $('.btn-category').click(function(){
    $('.btn-create-post').removeClass('disabled');
  });
});

var action = {
  showMenu: function(){
    var menuItems = $('#menuItems');
    if (menuItems && menuItems.length > 0) {
      $('.plus-menu').toggleClass('hidden');
    } else {
      newPost.showModal();
    }
  }
};

var nav = {
  toggleMenu: function(e) {
    var target        = e.target;
    var windowWidth   = $(window).width();
    var settingsMenu  = $(target).parents('.settings-avatar-menu')
    var navbarMenu    = $(target).parent('.avatar-menu');
    var menu;
    var tooltip;

    if (navbarMenu.length) {
      menu = $(navbarMenu).children('.user-menu');
      tooltip = $('.tool-tip');
    }
    if (settingsMenu.length) {
      menu = $(settingsMenu).children('.user-menu');
      tooltip = $('.settings-tool-tip');
    }
    $(tooltip).toggleClass('rotated');
    if (windowWidth > 500) {
      menu.toggle();
    }
    else {
      menu.slideToggle();
    }
  },

  toggleSettings: function() {
    $('.settings').toggleClass('settings-visable');
    $('body').toggleClass('body-push');
    $('.navbar .container').toggleClass('body-push');
    $('.overlay').toggle();
  },
  navigate: function(url){
    if (window.location.pathname != url) {
      window.location = url;
    } else {
      nav.toggleSettings();
    }
  },
  goToHomeFeed: function(){
    window.location = baseURL + '/';
  }
};

var modal = {
  cancel: function(e){
    var shouldDismiss = true;
    if (e) {
      shouldDismiss = $(e.target).is('.create-overlay');
    }
    if (shouldDismiss){
      $('.create-overlay').remove();
      $('body').removeClass('noscroll');
    }
  }
}

var group = {
  showNewGroupForm: function(){
    var organization = $('input#selectedOrganization').val();
    $.ajax({
      method: 'GET',
      url: '/profile/groups',
      contentType: 'text/html',
      headers: {organization: organization}
    })
    .done(function(html){
      $('body').addClass('noscroll');
      $('body').prepend(html);
      $('#newGroup').submit(group.createNewGroup);
    });
  },
  selectRadio: function(e){
    var $target = $(e.target);
    var checkbox = 'input[type="checkbox"]';
    if (!$target.is(checkbox) ){
      if (!$target.is('label')){
        if ($target.is('.content')){
          var checked = $target.children(checkbox).prop('checked');
          $target.children(checkbox).prop('checked', !checked);
        } else {
            var checked = $target.siblings(checkbox).prop('checked');
            $target.siblings(checkbox).prop('checked', !checked);
        }
      }
    }
  },
  createNewGroup: function(){
    var organization = $('input#selectedOrganization').val();
    var data = $('#newGroup').serialize();
    $.ajax({
      type: 'POST',
      url:  '/profile/groups',
      data: data,
      headers: {organization: organization}
    })
    .done(function(html){
      window.location = window.location.pathname;
    });
    return false;    
  },
  filterMembers: function(e){
    var $target = $(e.target);
    var t = $target.val();
    var r = new RegExp(t, 'i');
    $('.selectArea .option').each(function(i){
      var $this = $(this);
      var s = $this.children('.content').first().children('.name').first().text();
      if (s.match(r) || t == '') {
        $this.show();
      } else {
        $this.hide();
      }
    });
  }
};

var login = {
  displayForm: function() {
    $('.front').css('display', 'none');
    $('.back').css('display', 'inherit');
  },
  register: function() {
    window.location = baseURL + '/register';
  }
};

var newPost = {
  showModal: function() {
    $('#newPostModal').modal();
  }
}

$(function() {
  $('img.lazy').lazyload();
  window.scrollTo(0, 0);
});
