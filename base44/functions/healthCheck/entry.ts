Deno.serve(() => {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "ClientSurge Systems",
  });
});