AOS.init({
	once: true,
});


var swiper_intro = new Swiper(".intro-slider", {
	navigation: {
		nextEl: "#intro .swiper-button-next",
		prevEl: "#intro .swiper-button-prev",
	},
});

var swiper_desc = new Swiper(".slider-in-desc", {
	navigation: {
		nextEl: ".slider-in-desc .swiper-button-next",
		prevEl: ".slider-in-desc .swiper-button-prev",
	},
});

$(document).ready(function () {
	$('#nav-icon1,#nav-icon2,#nav-icon3,#nav-icon4').click(function () {
		$(this).toggleClass('open');
	});
});

