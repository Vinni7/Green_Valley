(function($) {
$(function() {

  $('ul.rest-tabs__tabs-switcher').on('click', 'li:not(.active)', function() {
    $(this)
      .addClass('active').siblings().removeClass('active')
      .closest('div.rest-tabs').find('div.rest-tabs__item').removeClass('active').eq($(this).index()).addClass('active');
  });

});
})(jQuery);