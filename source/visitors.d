module visitors;

enum ReverseProxy = true;

import vibe.vibe;

import core.atomic;

import std.algorithm;
import std.conv;
import std.functional;
import std.string;

shared int visitcount;
shared int savedVisits;

shared static this()
{
	if (existsFile("visits.txt"))
		visitcount = readFileUTF8("visits.txt").strip.to!int;
}

string getIP(scope HTTPServerRequest req)
{
	static if (ReverseProxy)
		return req.headers.get("X-Forwarded-For", req.headers.get("X-Real-IP",
				req.clientAddress.toAddressString()));
	else
		return req.clientAddress.toAddressString();
}

string[20] recentIPs;
int ipCounter;

void saveVisits()
{
	const count = visitcount;
	if (savedVisits == count)
		return;
	savedVisits = count;
	writeFileUTF8(NativePath("visits.txt"), count.to!string);
}

int hit(scope HTTPServerRequest req)
{
	auto ip = req.getIP;
	if (recentIPs[].canFind(ip))
		return visitcount;

	recentIPs[ipCounter] = ip;
	ipCounter = (ipCounter + 1) % recentIPs.length;

	return atomicOp!"+="(visitcount, 1);
}
