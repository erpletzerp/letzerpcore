window.disable_signup = {{ disable_signup and "true" or "false" }};

var demo_usr_id = "demo@user.com"

window.login = {};

login.bind_events = function() {
	$(window).on("hashchange", function() {
		login.route();
	});

	$(".form-login").on("submit", function(event) {
		if (window.location.href.split('/')[2]=='demo.letzerp.com'){
			event.preventDefault();
			var args = {};
			args.cmd = "login";
			args.usr = "guest@gmail.com";
			args.pwd = "guest";
			demo_usr_id = ($("#login_email").val() || "demo@user.com").trim();
			user_name = ($("#user_name").val() || "").trim();
			company = ($("#company").val() || "").trim();
			phone_no = ($("#phone_no").val() || "").trim();
		}
		else{
			var args = {};
			args.cmd = "login";
			args.usr = ($("#login_email").val() || "").trim();
			args.pwd = $("#login_password").val();
			if(!args.usr || !args.pwd) {
				frappe.msgprint(__("Both login and password required"));
				return false;
			}
		}
		login.call(args);
		return false;
	});

	$(".form-signup").on("submit", function(event) {
		event.preventDefault();
		var args = {};
		//console.log("signup");
		args.cmd = "frappe.core.doctype.user.user.sign_up";
		args.subdomain = ($("#subdomain").val() || "").trim();
		args.company_name = ($("#company_name").val() || "").trim();
		args.full_name = ($("#full_name").val() || "").trim();
		args.email = ($("#email").val() || "").trim();
		if(!args.email || !valid_email(args.email) || !args.full_name || !args.subdomain ) {
			frappe.msgprint(__("Valid SubDomain , email and name required"));
			return false;
		}		
		//login.call(args);
		frappe.call({
						method: "frappe.core.doctype.user.user.sign_up",
						args:{'args':args},
						callback: function(r) {
							alert(r.message);
							if (r.message=='Registration Details will be send on your email id soon. '){
								window.location.reload();
							}
						}
		});
		
	});

	$(".form-forgot").on("submit", function(event) {
		event.preventDefault();
		var args = {};
		args.cmd = "frappe.core.doctype.user.user.reset_password";
		args.user = ($("#forgot_email").val() || "").trim();
		if(!args.user) {
			frappe.msgprint(__("Valid Login id required."));
			return false;
		}
		login.call(args);
		return false;
	});
}


login.route = function() {
	var route = window.location.hash.slice(1);
	if(!route) route = "login";
	login[route]();
}

login.login = function() {
	$("form").toggle(false);
	$(".form-login").toggle(true);
}

login.forgot = function() {
	$("form").toggle(false);
	$(".form-forgot").toggle(true);
}

login.signup = function() {
	$("form").toggle(false);
	$(".form-signup").toggle(true);
}


// Login
login.call = function(args) {
	frappe.freeze();

	$.ajax({
		type: "POST",
		url: "/",
		data: args,
		dataType: "json",
		statusCode: login.login_handlers
	}).always(function(){
		frappe.unfreeze();
	});
}

login.login_handlers = (function() {
	var get_error_handler = function(default_message) {
		return function(xhr, data) {
			if(xhr.responseJSON) {
				data = xhr.responseJSON;
			}
			var message = data._server_messages
				? JSON.parse(data._server_messages).join("\n") : default_message;
		};
	}
	var login_handlers = {
		200: function(data) {
			if(data.message=="Logged In") {
				// save email id
				if (window.location.href.split('/')[2]=='demo.letzerp.com'){
					return frappe.call({
						method: "frappe.templates.pages.login.save_demo_user_id",
						args:{'user': demo_usr_id,
							  'user_name':user_name,
							  'company':company,
							  'phone_no':phone_no
						},
						callback: function(r) {
							window.location.href = get_url_arg("redirect-to") || "/desk";
						}
					});
				}
				else{
					window.location.href = get_url_arg("redirect-to") || "/desk";
				}
				
			} else if(data.message=="No App") {
				if(localStorage) {
					var last_visited =
						localStorage.getItem("last_visited")
						|| get_url_arg("redirect-to");
					localStorage.removeItem("last_visited");
				}

				if(last_visited && last_visited != "/login") {
					window.location.href = last_visited;
				} else {
					window.location.href = "/me";
				}
			} else if(["#signup", "#forgot"].indexOf(window.location.hash)!==-1) {
			}
		},
		401: get_error_handler(__("Invalid Login")),
		417: get_error_handler(__("Oops! Something went wrong"))
	};

	return login_handlers;
})();

frappe.ready(function() {
	login.bind_events();

	if (!window.location.hash) {
		if (frappe.supports_pjax()) {
			// preserve back button
			window.history.replaceState(window.history.state, window.document.title, window.location.href + "#login");
			$(window).trigger("hashchange");
		} else {
			window.location.hash = "#login";
		}
	} else {
		$(window).trigger("hashchange");
	}

	$(".form-signup, .form-forgot").removeClass("hide");
	$(document).trigger('login_rendered');
});


