module visitors;

import vibe.vibe;

import core.atomic;

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

void saveVisits()
{
	const count = visitcount;
	if (savedVisits == count)
		return;
	savedVisits = count;
	writeFileUTF8(NativePath("visits.txt"), count.to!string);
}

int hit()
{
	return atomicOp!"+="(visitcount, 1);
}
