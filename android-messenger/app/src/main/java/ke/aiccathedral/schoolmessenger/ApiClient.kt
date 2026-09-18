package ke.aiccathedral.schoolmessenger
import android.content.Context
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
object ApiClient {
 private fun post(c:Context,b:JSONObject):JSONObject { val x=(URL(Config.endpoint(c)).openConnection() as HttpURLConnection).apply{requestMethod="POST";connectTimeout=15000;readTimeout=30000;doOutput=true;setRequestProperty("Authorization","Bearer ${Config.token(c)}");setRequestProperty("Content-Type","application/json")}; x.outputStream.use{it.write(b.toString().toByteArray())}; val s=if(x.responseCode in 200..299)x.inputStream else x.errorStream; val t=s?.bufferedReader()?.use{it.readText()}?:"{}"; if(x.responseCode !in 200..299)throw IllegalStateException("HTTP ${x.responseCode}: $t"); return JSONObject(t)}
 fun check(c:Context)=post(c,JSONObject().put("action","next"))
 fun complete(c:Context,id:String,sent:Boolean,error:String?=null)=post(c,JSONObject().put("action","complete").put("recipient_id",id).put("status",if(sent)"sent" else "failed").put("error_message",error?:""))
}