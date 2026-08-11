import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAddress } from "viem";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db`select * from requests order by created_at desc`;
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { content_hash, requester, status } = body;

  if (!content_hash || !requester || status === undefined || status === null) {
    return NextResponse.json(
      { error: "Missing required fields: content_hash, requester, status" },
      { status: 400 },
    );
  }

  try {
    const rows = await db`
      update requests set status = ${status}
      where content_hash = ${content_hash} and requester = ${requester}
      returning *
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { content_hash, requester, title, description, reward, token } = body;

  if (!content_hash || !requester || !title || !reward || !token) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!isAddress(requester) || !isAddress(token) || !/^\d+$/.test(String(reward)) || BigInt(reward) <= 0n) {
    return NextResponse.json({ error: "Invalid requester, token, or reward" }, { status: 400 });
  }

  try {
    const rows = await db`
      insert into requests (content_hash, requester, title, description, reward, token, status)
      values (${content_hash}, ${requester}, ${title}, ${description ?? ""}, ${reward}, ${token}, 0)
      returning *
    `;
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 },
    );
  }
}
