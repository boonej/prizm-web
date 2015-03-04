// $(document).ready(function(){
//   $(document).mouseup(function(e){
//     var container = $('.user-menu');
//     var toggleMenu = $('.tool-tip');
//     if (!$(e.target).parents('.avatar-menu').length) {
//       if (toggleMenu.hasClass('rotated')){
//         if ($(window).width() > 500) {
//           container.toggle();
//         } else {
//           container.slideToggle(); 
//         }
//         $('.tool-tip').toggleClass('rotated');
//       }
//     }
//   });
// });

var nav = {
  toggleMenu: function(e) {
    var target        = e.target;
    var windowWidth   = $(window).width();
    var settingsMenu  = $(target).parent('.settings-avatar-menu')
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
    $('.navbar-header').toggleClass('body-push');
    $('.overlay').toggle();
  },

  goToHomeFeed: function(){
    window.location = baseURL + '/';
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

/* Fix for Navbar (bootstrap modal moves it right 15px) */
/* This seems to shift it left on my browsers 
$(function() {
  $('body').on('show.bs.modal', function() {
    $('.navbar-default').css('right', '15px');
  });
  $('body').on('hidden.bs.modal', function() {
    $('.navbar-default').css('right', '0px');
  });
});

*/

/* Add current field to .user-menu based of window location */
// $(function(){
//   var location = window.location.pathname;
//   $('a[href="' + location + '"]').addClass('current');
// });
$(function() {
  $('img.lazy').lazyload();
});
