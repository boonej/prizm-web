var isFetching = false;

function startPage(){
 messages.scrollToLatest();
  $('#newMessage').submit(function(){
    var text = $('#newMessage input').val();
    var organization = $('input#selectedOrganization').val();
    var group = $('input#selectedGroup').val();
    $.ajax({
      type: 'POST',
      url: '/messages',
      contentType: 'application/json',
      headers: {
        organization: organization,
        group: group,
        text: text
      }
    })
    .done(function(){
      $('#newMessage input').val('');
      messages.refresh();
    });
    return false;
  });

  $('#messages').scroll(function(){
    if ($('#messages').scrollTop() < 200) {
      if (!isFetching){
        messages.fetchOlder();
      }
    }
  });

  $('div.topic').click(function(){
    var width = $(window).width();
    if (width < 601) {
      $('.left-box').addClass('visible');
    }
  });
  $('.left-box .header').click(function(){
    var width = $(window).width();
    if (width < 601) {
      $('.left-box').removeClass('visible');
    }
  });
}

var messages = {
  scrollToLatest: function(){
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  },
  changeTopic: function(e){
    isFetching = true;
    var target = e.target;
    var topic = $(target).text();
    var organization = $('input#selectedOrganization').val();
    $('.right-box .topic').text(topic);
    $('#newMessage input').attr('placeholder', 'Post a message to ' + topic + '...');
    topic = topic?topic.substr(1):'all';
    var group = $(target).attr('dataID') || 'all';
    $('input#selectedGroup').val(group);
    $('li.topic').removeClass('active');
    $(target).addClass('active');   
    $('#messages').html('');
    $.ajax({
      method: 'GET',
      url : '/messages/' + group,
      headers: {
        organization: organization,
        'content-type': 'text/html'
      }
    })
    .done(function(html){
      $('#messages').html(html);
      $('input#lastMessage').val($('li.message:first').attr('created'));
      isFetching = false;
      messages.scrollToLatest();
      var width = $(window).width();
      if (width < 601) {
        $('.left-box').removeClass('visible');
      }
    });
  },
  refresh: function(){
    isFetching = true;
    var organization = $('input#selectedOrganization').val();
    var group = $('input#selectedGroup').val();
    $.ajax({
      method: 'GET',
      url : '/messages/' + group,
      headers: {
        organization: organization,
        'content-type': 'text/html'
      }
    })
    .done(function(html){
      $('#messages').html(html);
      $('input#lastMessage').val($('li.message:first').attr('created'));
      isFetching = false;
      messages.scrollToLatest();
    });
  },
  fetchOlder: function(){
    isFetching = true;
    var organization = $('input#selectedOrganization').val();
    var group = $('input#selectedGroup').val();
    var lastDate =  $('input#lastMessage').val();
    $.ajax({
      method: 'GET',
      url: '/messages/' + group,
      contentType: 'text/html',
      headers: {
        organization: organization,
        lastDate: lastDate
      }
    })
    .done(function(html){
      $('#messages').prepend(html);
      $('input#lastMessage').val($('li.message:first').attr('created'));
      isFetching = false;
    });
  }
};


$(document).ready(function(){
  startPage();
});

