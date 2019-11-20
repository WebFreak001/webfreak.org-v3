module files;

enum ReverseProxy = true;

import vibe.vibe;

import std.algorithm;
import std.datetime.systime;
import std.range;
import std.regex;
import std.stdio;
import std.uni;
import std.utf;
import std.uuid;

static immutable bad = ctRegex!`(\p{Z}|\p{C}|\s)+`;

string encodePart(string value, int maxLength)
{
	validate(value);
	value = normalize(value);
	value = value.replaceAll(bad, " ");
	if (value.byCodePoint.count > maxLength)
		throw new Exception("Message is too long");
	return value;
}

struct Guestbook
{
	struct Entry
	{
		string sender;
		string message;
		SysTime timestamp;
		bool verified;
		string ip;

		string toString() const
		{
			return timestamp.toISOExtString ~ ">" ~ (verified
					? 'c' : 'n') ~ ip ~ ">" ~ sender.encodePart(16) ~ ">" ~ message.encodePart(120);
		}

		static Entry fromString(string line)
		{
			Entry ret;
			auto end = line.indexOf('>');
			if (end == -1)
				return ret;
			ret.timestamp = SysTime.fromISOExtString(line[0 .. end]);
			line = line[end + 1 .. $];
			ret.verified = line.length && line[0] == 'c';
			line = line[1 .. $];

			end = line.indexOf('>');
			if (end == -1)
				return ret;

			ret.ip = line[0 .. end];
			line = line[end + 1 .. $];

			end = line.indexOf('>');
			if (end == -1)
				return ret;

			ret.sender = line[0 .. end];
			ret.message = line[end + 1 .. $];
			return ret;
		}
	}

	Entry[128] entries;
	int c;
	string ip;

	void push(Entry entry)
	{
		entries[c] = entry;
		c = (c + 1) % entries.length;
	}

	int opApply(int delegate(Entry) dg)
	{
		int i = (c - 1 + entries.length) % entries.length;
		while (i != c && entries[i] != Entry.init)
		{
			if (entries[i].verified || entries[i].ip == ip)
				if (dg(entries[i]))
					return 1;
			i = (i - 1 + entries.length) % entries.length;
		}
		return 0;
	}
}

string getIP(scope HTTPServerRequest req)
{
	static if (ReverseProxy)
		return req.headers.get("X-Forwarded-For", req.headers.get("X-Real-IP",
				req.clientAddress.toAddressString()));
	else
		return req.clientAddress.toAddressString();
}

class FilesWebInterface
{
	private
	{
		SessionVar!(string, "token") ms_token;
	}

	void getGuestbook()
	{
		Guestbook book;

		if (existsFile("guestbook.txt"))
			foreach (line; File("guestbook.txt").byLineCopy)
				if (line.strip.length)
					book.push(Guestbook.Entry.fromString(line.strip));

		book.ip = request.getIP();
		string token = randomUUID().toString();
		ms_token = token;
		string name = null;
		string message = null;
		render!("guestbook.dt", book, token, name, message);
	}

	void postGuestbook(string token, string name, string message)
	{
		if (ms_token != token)
			throw new Exception("invalid token");

		Guestbook book;

		if (existsFile("guestbook.txt"))
			foreach (line; File("guestbook.txt").byLineCopy)
				if (line.strip.length)
					book.push(Guestbook.Entry.fromString(line.strip));

		Guestbook.Entry entry;
		entry.timestamp = Clock.currTime;
		entry.sender = name;
		entry.message = message;
		entry.verified = false;
		entry.ip = book.ip = request.getIP();

		string error;

		foreach (last; book)
		{
			if (last.ip == entry.ip)
			{
				if (entry.timestamp - last.timestamp < 1.minutes)
					error ~= "Please wait a little bit before retrying. ";
				break;
			}
		}

		if (entry.sender.length < 2)
			error ~= "Author name too short. ";
		if (entry.sender.length > 16)
			error ~= "Author name too long. ";
		if (entry.message.length < 12)
			error ~= "Message too short. Please think of more content and try to write down all your thoughts to avoid spam. ";
		if (entry.message.length > 120)
			error ~= "Message too long. Please keep it short enough for everyone to read. ";

		if (error.length)
			render!("guestbook.dt", book, token, name, message, error);
		else
		{
			appendToFile(NativePath("guestbook.txt"), entry.toString() ~ '\n');

			redirect("/guestbook", 303);
		}
	}

	void getGallery()
	{
		string[] images;

		auto path = NativePath("public/gallery");
		foreach (file; iterateDirectory(path))
		{
			if (!file.isFile)
				continue;

			if (!file.name.endsWith(".thumb.jpg"))
				continue;

			images ~= file.name;
		}

		render!("gallery.dt", images);
	}

	@path("/gallery/preview/:file")
	void getGalleryPreview(string _file)
	{
		string file = _file;
		string fullfile = _file;
		if (file.endsWith(".png", ".jpg"))
			file = file[0 .. $ - 4] ~ ".low" ~ file[$ - 4 .. $];
		FileInfo info;
		if (fullfile.indexOfAny("/\\") == -1)
			info = getFileInfo(NativePath("public/gallery") ~ fullfile);
		render!("gallery_preview.dt", file, fullfile, info);
	}
}
