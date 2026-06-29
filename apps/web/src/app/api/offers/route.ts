import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get("request_id");

  let query = supabaseAdmin
    .from("offers")
    .select("*")
    .order("created_at", { ascending: true });

  if (requestId) {
    query = query.eq("request_id", Number(requestId));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { request_id, seller, ipfs_cid, encrypted_key, file_name, file_type } = body;

  if (!request_id || !seller || !ipfs_cid || !encrypted_key || !file_name || !file_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("offers")
    .insert({
      request_id,
      seller,
      ipfs_cid,
      encrypted_key,
      file_name,
      file_type,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
