package ke.aiccathedral.schoolmessenger

import android.Manifest
import android.app.Activity
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.graphics.BitmapFactory
import android.graphics.Color
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.telephony.SmsManager
import android.widget.*
import org.json.JSONArray

class MainActivity : Activity() {
    private lateinit var connection: TextView
    private lateinit var queue: TextView
    private lateinit var messagePreview: TextView
    private lateinit var simSpinner: Spinner
    private lateinit var sendButton: Button
    private lateinit var progress: TextView
    private val handler = Handler(Looper.getMainLooper())
    private val sims = ArrayList<SubscriptionInfo>()
    private var pending = JSONArray()
    private var sending = false
    private var sent = 0
    private var failed = 0
    private var total = 0
    private val queueLoop = object : Runnable { override fun run() { if (!sending) refreshQueue(); handler.postDelayed(this, 3000) } }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        MainActivityHolder.activity = this
        window.statusBarColor = 0xFF7A1F3D.toInt()
        buildUi()
        requestPermissionsIfNeeded()
        loadSims()
        startService()
        refreshQueue()
        handler.postDelayed(queueLoop, 3000)
    }

    private fun buildUi() {
        val scroll = ScrollView(this)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(28, 24, 28, 28)
        }
        scroll.addView(root)
        setContentView(scroll)

        val logo = ImageView(this).apply {
            setImageBitmap(BitmapFactory.decodeStream(resources.openRawResource(R.raw.aic_cathedral_logo)))
            adjustViewBounds = true
            scaleType = ImageView.ScaleType.FIT_CENTER
            setBackgroundColor(Color.WHITE)
            setPadding(0, 0, 0, 12)
            layoutParams = LinearLayout.LayoutParams(-1, 180)
        }
        root.addView(logo)

        val brand = TextView(this).apply {
            text = "AIC School Messenger"
            textSize = 28f
            setTextColor(0xFF7A1F3D.toInt())
            setTypeface(null, android.graphics.Typeface.BOLD)
            setPadding(0, 8, 0, 2)
        }
        root.addView(brand)
        root.addView(TextView(this).apply {
            text = "Automatic ERP SMS bridge"
            textSize = 16f
            setTextColor(0xFF666666.toInt())
            setPadding(0, 0, 0, 18)
        })

        connection = label("ERP connection: Checking…", 18f)
        root.addView(connection)

        queue = label("Waiting for an SMS from ERP…", 20f)
        queue.setTypeface(null, android.graphics.Typeface.BOLD)
        root.addView(queue)

        messagePreview = label("No pending message", 15f)
        messagePreview.setPadding(0, 4, 0, 18)
        root.addView(messagePreview)

        root.addView(label("Select sending SIM", 15f))
        simSpinner = Spinner(this)
        root.addView(simSpinner)

        sendButton = Button(this).apply {
            text = "SEND PENDING SMS"
            isEnabled = false
            setOnClickListener { sendPending() }
        }
        root.addView(sendButton)

        progress = label("Ready. Messages sent from the selected SIM.", 16f)
        progress.setPadding(0, 16, 0, 8)
        root.addView(progress)

        root.addView(Button(this).apply {
            text = "REFRESH ERP QUEUE"
            setOnClickListener { refreshQueue() }
        })

        root.addView(TextView(this).apply {
            text = "The app checks the ERP automatically. Keep this phone online with the school SIM active."
            textSize = 14f
            setTextColor(0xFF666666.toInt())
            setPadding(0, 18, 0, 0)
        })
    }

    private fun label(text: String, size: Float) = TextView(this).apply {
        this.text = text
        textSize = size
        setTextColor(0xFF242024.toInt())
        setPadding(0, 8, 0, 8)
    }

    private fun requestPermissionsIfNeeded() {
        val permissions = ArrayList<String>()
        if (Build.VERSION.SDK_INT >= 23 &&
            checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.SEND_SMS)
        }
        if (Build.VERSION.SDK_INT >= 22 &&
            checkSelfPermission(Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.READ_PHONE_STATE)
        }
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        if (permissions.isNotEmpty()) requestPermissions(permissions.toTypedArray(), 77)
    }

    private fun loadSims() {
        sims.clear()
        try {
            if (Build.VERSION.SDK_INT >= 22 &&
                checkSelfPermission(Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                val manager = getSystemService(TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager
                manager.activeSubscriptionInfoList?.let { sims.addAll(it) }
            }
        } catch (_: Exception) {}
        val names = ArrayList<String>()
        for (i in sims.indices) {
            val carrier = sims[i].carrierName?.toString()?.takeIf { it.isNotBlank() } ?: "Mobile network"
            names.add("SIM " + (i + 1) + " • " + carrier)
        }
        if (names.isEmpty()) names.add("Automatic / default SIM")
        simSpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, names)
    }

    private fun startService() {
        val intent = Intent(this, SmsPollingService::class.java)
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(intent) else startService(intent)
    }

    private fun refreshQueue() {
        Thread {
            try {
                val result = ApiClient.check(this)
                val recipients = result.optJSONArray("recipients") ?: JSONArray()
                runOnUiThread { applyQueue(result, recipients) }
            } catch (e: Exception) {
                runOnUiThread {
                    connection.text = "ERP connection: Not connected"
                    queue.text = "Waiting for ERP connection…"
                    messagePreview.text = e.message ?: "Connection error"
                    sendButton.isEnabled = false
                }
            }
        }.start()
    }

    private fun applyQueue(result: org.json.JSONObject, recipients: JSONArray) {
        pending = recipients
        connection.text = "ERP connection: Connected ✓"
        if (recipients.length() == 0) {
            queue.text = "No pending SMS"
            messagePreview.text = "When you send an SMS from ERP Communications, it will appear here automatically."
            sendButton.isEnabled = false
            return
        }
        val message = recipients.optJSONObject(0)?.optString("message", "") ?: ""
        queue.text = "${recipients.length()} SMS ready from ERP"
        messagePreview.text = if (message.length > 180) message.take(180) + "…" else message
        sendButton.isEnabled = !sending
    }

    private fun sendPending() {
        if (sending) return
        if (pending.length() == 0) {
            refreshQueue()
            return
        }
        if (Build.VERSION.SDK_INT >= 23 &&
            checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.SEND_SMS), 77)
            return
        }
        val selected = simSpinner.selectedItemPosition
        val subscriptionId = if (selected >= 0 && selected < sims.size) sims[selected].subscriptionId else null
        sending = true
        sent = 0
        failed = 0
        total = pending.length()
        sendButton.isEnabled = false
        progress.text = "Preparing ${total} SMS…"

        val ids = ArrayList<String>()
        for (i in 0 until pending.length()) {
            pending.optJSONObject(i)?.optString("id")?.takeIf { it.isNotBlank() }?.let { ids.add(it) }
        }

        Thread {
            try {
                val broadcastId = pending.optJSONObject(0)?.optString("broadcast_id", "") ?: ""
                ApiClient.claim(this, broadcastId, ids)
                for (i in 0 until pending.length()) {
                    val r = pending.optJSONObject(i) ?: continue
                    val id = r.optString("id")
                    val phone = r.optString("phone")
                    val body = r.optString("message")
                    handler.postDelayed({
                        sendOne(id, phone, body, i, subscriptionId)
                    }, i * 650L)
                }
            } catch (e: Exception) {
                runOnUiThread {
                    sending = false
                    sendButton.isEnabled = true
                    progress.text = "Could not start sending: ${e.message}"
                }
            }
        }.start()
    }

    private fun sendOne(id: String, phone: String, body: String, index: Int, subscriptionId: Int?) {
        try {
            val manager = if (subscriptionId != null && Build.VERSION.SDK_INT >= 22)
                SmsManager.getSmsManagerForSubscriptionId(subscriptionId)
            else SmsManager.getDefault()

            val sentIntent = Intent(this, SmsResultReceiver::class.java)
                .setAction("AIC_SMS_SENT")
                .putExtra("recipient_id", id)
                .putExtra("index", index)
                .putExtra("phone", phone)
                .setPackage(packageName)
            val deliveredIntent = Intent(this, SmsResultReceiver::class.java)
                .setAction("AIC_SMS_DELIVERED")
                .putExtra("recipient_id", id)
                .putExtra("index", index)
                .putExtra("phone", phone)
                .setPackage(packageName)
            val flags = if (Build.VERSION.SDK_INT >= 23)
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            else PendingIntent.FLAG_UPDATE_CURRENT

            manager.sendTextMessage(
                phone, null, body,
                PendingIntent.getBroadcast(this, 10000 + index, sentIntent, flags),
                PendingIntent.getBroadcast(this, 20000 + index, deliveredIntent, flags)
            )
        } catch (e: Exception) {
            onSendResult(false, id, index, "SMS error: ${e.message}")
        }
    }

    fun onSendResult(ok: Boolean, id: String, index: Int, error: String?) {
        if (ok) sent++ else failed++
        val processed = sent + failed
        runOnUiThread {
            progress.text = "Sent: ${sent}   Failed: ${failed}   Processed: ${processed} / ${total}"
            if (processed >= total) {
                sending = false
                sendButton.isEnabled = true
                progress.text = "Finished • Sent ${sent} • Failed ${failed} / ${total}"
                refreshQueue()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        loadSims()
        refreshQueue()
    }

    override fun onDestroy() {
        handler.removeCallbacks(queueLoop)
        if (MainActivityHolder.activity === this) MainActivityHolder.activity = null
        super.onDestroy()
    }
}
