module webinterface;

import vibe.vibe;

import std.algorithm;
import std.array;
import std.ascii;
import std.conv;
import std.path;
import std.range;
import std.regex;

struct BlogEntry
{
	string date;
	string id;
	string url;
	string title;
	string html;
}

SysTime lastCacheUpdate;
BlogEntry[] blogEntries;

void updateCache()
{
	if (lastCacheUpdate == SysTime.init || Clock.currTime() - lastCacheUpdate > 10.minutes)
	{
		lastCacheUpdate = Clock.currTime();

		const blog = NativePath("blog");

		BlogEntry[] entries;
		foreach (file; iterateDirectory(blog))
		{
			if (file.isFile)
				entries ~= parseBlog(blog ~ file.name, file);
		}
		blogEntries = entries;
	}
}

static immutable dateRegex = ctRegex!`^\d{4}-\d{2}-\d{2}[-_]?`;

BlogEntry parseBlog(NativePath file, FileInfo info)
{
	BlogEntry ret;
	auto content = readFileUTF8(file);
	string name = file.head.name.stripExtension;
	if (auto match = name.matchFirst(dateRegex))
	{
		ret.date = name[0 .. 10];
		ret.id = match.post();
	}
	else
	{
		ret.date = (cast(Date) info.timeModified).toISOExtString;
		ret.id = name;
	}
	name = ret.date[0 .. 7] ~ "/" ~ ret.date[8 .. 10] ~ "/" ~ ret.id;
	ret.url = "/blog/" ~ name;
	ret.title = getTitle(content, ret.id);
	ret.html = filterMarkdown(content);
	ret.html = ret.html.replace(`<a href="https://niu.moe`, `<a rel="me" href="https://niu.moe`);
	return ret;
}

string getTitle(string markdown, string fallback)
{
	markdown = markdown.strip();
	if (markdown.startsWith("# "))
	{
		auto nl = markdown.indexOf('\n');
		if (nl == -1)
			nl = markdown.length;
		return markdown[2 .. nl];
	}
	else
		return fallback;
}

class WebInterface
{
	void index()
	{
		renderIndex(blogEntries);
	}

	void getBlog()
	{
		index();
	}

	void renderIndex(BlogEntry[] blogEntries)
	{
		render!("index.dt", blogEntries);
	}

	void renderEntry(BlogEntry entry)
	{
		render!("blog.dt", entry);
	}

	@path("/:month")
	void getMonth(string _month)
	{
		if (_month.length == 7 && _month[0 .. 4].all!isDigit && _month[5 .. 7].all!isDigit)
		{
			auto list = blogEntries.filter!(a => a.date.startsWith(_month));
			if (!list.empty)
				renderIndex(list.array);
		}
		else
		{
			_month = _month.stripExtension;
			auto i = blogEntries.countUntil!(a => a.id == _month);
			if (i != -1)
				renderEntry(blogEntries[i]);
		}
	}

	@path("/:month/:day")
	void getMonthDay(string _month, string _day)
	{
		if (_month.length == 7 && _month[0 .. 4].all!isDigit
				&& _month[5 .. 7].all!isDigit && _day.length == 2 && _day.all!isDigit)
		{
			auto list = blogEntries.filter!(a => a.date.startsWith(chain(_month, "-", _day)));
			if (!list.empty)
				renderIndex(list.array);
		}
	}

	@path("/:month/:day/:id")
	void getMonthDay(string _month, string _day, string _id)
	{
		_id = _id.stripExtension;
		auto i = blogEntries.countUntil!(a => a.id == _id);
		if (i != -1)
			renderEntry(blogEntries[i]);
	}
}
