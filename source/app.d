import vibe.vibe;

import files;
import visitors;
import webinterface;

import std.algorithm;

void main(string[] args)
{
	auto settings = new HTTPServerSettings();
	settings.bindAddresses = ["::1", "127.0.0.1"];
	settings.port = 3000;
	settings.sessionStore = new MemorySessionStore();

	HTTPFileServerSettings files = new HTTPFileServerSettings();
	files.maxAge = 365.days;

	updateCache();

	auto router = new URLRouter();
	router.get("*", transformWebp());
	router.get("*", serveStaticFiles("public", files));
	auto blog = new WebInterface();
	router.registerWebInterface(blog);
	auto blogSubdir = new WebInterfaceSettings();
	blogSubdir.urlPrefix = "/blog";
	router.registerWebInterface(blog, blogSubdir);
	router.get("/about", &getAbout);
	router.get("/dmans", &getDMans);
	router.get("/games", &getGames);
	router.get("/login", &getLogin);
	router.registerWebInterface(new FilesWebInterface());

	setTimer(10.seconds, toDelegate(&saveVisits), true);

	listenHTTP(settings, router);

	runApplication();
}

HTTPServerRequestDelegateS transformWebp()
{
	return (scope HTTPServerRequest req, scope HTTPServerResponse res) {
		auto path = req.requestPath;
		if (path.head.name.endsWith(".img"))
		{
			if (req.headers.get("Accept", "").canFind("image/webp"))
				path = path.parentPath ~ InetPath.Segment(path.head.name[0 .. $ - 4] ~ ".webp");
			else
				path = path.parentPath ~ InetPath.Segment(path.head.name[0 .. $ - 4] ~ ".jpg");

			res.redirect(path.toString);
		}
	};
}

void getAbout(scope HTTPServerRequest req, scope HTTPServerResponse res)
{
	res.render!("about.dt", req);
}

void getDMans(scope HTTPServerRequest req, scope HTTPServerResponse res)
{
	res.render!("dmans.dt", req);
}

void getGames(scope HTTPServerRequest req, scope HTTPServerResponse res)
{
	res.render!("games.dt", req);
}

void getLogin(scope HTTPServerRequest req, scope HTTPServerResponse res)
{
	res.render!("login.dt", req);
}
