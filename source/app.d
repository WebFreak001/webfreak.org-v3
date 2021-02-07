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
	files.cacheControl = "public";

	updateCache();

	auto router = new URLRouter();
	router.get("*", transformWebp(serveStaticFiles("public", files)));
	auto blog = new WebInterface();
	router.registerWebInterface(blog);
	auto blogSubdir = new WebInterfaceSettings();
	blogSubdir.urlPrefix = "/blog";
	router.registerWebInterface(blog, blogSubdir);
	router.get("/about", &renderSimple!"about.dt");
	router.get("/projects", &renderSimple!"projects.dt");
	router.get("/dmans", &renderSimple!"dmans.dt");
	router.get("/games", &renderSimple!"games.dt");
	router.get("/login", &renderSimple!"login.dt");
	router.registerWebInterface(new FilesWebInterface());

	setTimer(10.seconds, toDelegate(&saveVisits), true);

	listenHTTP(settings, router);

	runApplication();
}

HTTPServerRequestDelegateS transformWebp(HTTPServerRequestDelegateS serve)
{
	import std.typecons : Nullable;

	return (scope HTTPServerRequest req, scope HTTPServerResponse res) {
		auto path = req.requestPath;
		if (path.head.name.endsWith(".img"))
		{
			if (req.headers.get("Accept", "").canFind("image/webp"))
				path = path.parentPath ~ InetPath.Segment(path.head.name[0 .. $ - 4] ~ ".webp");
			else
				path = path.parentPath ~ InetPath.Segment(path.head.name[0 .. $ - 4] ~ ".jpg");

			req.requestPath = path;
			req.requestURI = path.toString;

			foreach (ref v; req.tupleof) // reset path cache
				static if (is(typeof(v) : Nullable!string))
					v = null;
		}

		return serve(req, res);
	};
}

void renderSimple(string page)(scope HTTPServerRequest req, scope HTTPServerResponse res)
{
	res.render!(page, req);
}
