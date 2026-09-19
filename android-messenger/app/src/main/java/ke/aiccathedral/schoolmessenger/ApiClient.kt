package ke.aiccathedral.schoolmessenger

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object ApiClient {
    private fun post(c: Context, body: JSONObject): JSONObject {
        val connection = (URL(Config.endpoint(c)).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15000
            readTimeout = 30000
            doOutput = true
            setRequestProperty("Authorization", "Bearer ${Config.token(c)}")
            setRequestProperty("Content-Type", "application/json")
        }
        connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
        val code = connection.responseCode
        val stream = if (code in 200..299) connection.inputStream else connection.errorStream
        val text = stream?.bufferedReader()?.use { it.readText() } ?: "{}"
        if (code !in 200..299) throw IllegalStateException("HTTP $code: $text")
        return JSONObject(text)
    }

    fun check(c: Context) = post(c, JSONObject().put("action", "next"))

    fun claim(c: Context, broadcastId: String, ids: List<String>) =
        post(c, JSONObject().put("action", "claim").put("broadcast_id", broadcastId).put("recipient_ids", JSONArray(ids)))

    fun complete(c: Context, id: String, sent: Boolean, error: String? = null) =
        post(c, JSONObject().put("action", "complete")
            .put("recipient_id", id)
            .put("status", if (sent) "sent" else "failed")
            .put("error_message", error ?: ""))
}
