import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")
  return neon(url)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const resource = searchParams.get('resource')
    const success = searchParams.get('success')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const sql = getSql()
    
    let query = `
      SELECT al.*, u.name as user_name
      FROM access_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `
    
    const conditions = []
    const params = []
    
    if (userId) {
      conditions.push(`al.user_id = $${params.length + 1}`)
      params.push(userId)
    }
    
    if (action) {
      conditions.push(`al.action = $${params.length + 1}`)
      params.push(action)
    }
    
    if (resource) {
      conditions.push(`al.resource = $${params.length + 1}`)
      params.push(resource)
    }
    
    if (success !== null) {
      conditions.push(`al.success = $${params.length + 1}`)
      params.push(success === 'true')
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }
    
    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)
    
    const logs = await sql.unsafe(query, params)
    
    // S'assurer que c'est un tableau
    const logsArray = Array.isArray(logs) ? logs : []
    
    return NextResponse.json(logsArray)
  } catch (error) {
    console.error("Error fetching access logs:", error)
    return NextResponse.json({ error: "Failed to fetch access logs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      userName, 
      action, 
      resource, 
      resourceId, 
      success, 
      details, 
      ipAddress, 
      userAgent 
    } = await request.json()
    
    if (!action || !resource) {
      return NextResponse.json({ error: "Action and resource are required" }, { status: 400 })
    }
    
    const sql = getSql()
    
    const result = await sql`
      INSERT INTO access_logs (user_id, user_name, action, resource, resource_id, success, details, ip_address, user_agent)
      VALUES (${userId || null}, ${userName || null}, ${action}, ${resource}, ${resourceId || null}, ${success || true}, ${details || ''}, ${ipAddress || null}, ${userAgent || null})
      RETURNING id, user_id, user_name, action, resource, resource_id, success, details, ip_address, user_agent, created_at
    `
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating access log:", error)
    return NextResponse.json({ error: "Failed to create access log" }, { status: 500 })
  }
}

// Endpoint pour obtenir des statistiques des logs
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'stats') {
      const sql = getSql()
      
      // Statistiques générales
      const totalLogs = await sql`SELECT COUNT(*) as count FROM access_logs`
      const successLogs = await sql`SELECT COUNT(*) as count FROM access_logs WHERE success = true`
      const failedLogs = await sql`SELECT COUNT(*) as count FROM access_logs WHERE success = false`
      
      // Actions les plus fréquentes
      const topActions = await sql`
        SELECT action, COUNT(*) as count 
        FROM access_logs 
        GROUP BY action 
        ORDER BY count DESC 
        LIMIT 10
      `
      
      // Ressources les plus accédées
      const topResources = await sql`
        SELECT resource, COUNT(*) as count 
        FROM access_logs 
        GROUP BY resource 
        ORDER BY count DESC 
        LIMIT 10
      `
      
      // Utilisateurs les plus actifs
      const topUsers = await sql`
        SELECT user_name, COUNT(*) as count 
        FROM access_logs 
        WHERE user_name IS NOT NULL
        GROUP BY user_name 
        ORDER BY count DESC 
        LIMIT 10
      `
      
      return NextResponse.json({
        total: totalLogs[0].count,
        success: successLogs[0].count,
        failed: failedLogs[0].count,
        successRate: totalLogs[0].count > 0 ? (successLogs[0].count / totalLogs[0].count * 100).toFixed(2) : 0,
        topActions,
        topResources,
        topUsers
      })
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error getting access log stats:", error)
    return NextResponse.json({ error: "Failed to get access log stats" }, { status: 500 })
  }
}
