package com.sevensroyale.app;

import android.os.Bundle;
import android.view.View;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final long WEBVIEW_FADE_DURATION_MS = 420L;
    private static final long WEBVIEW_FADE_DELAY_MS = 120L;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NotificationPermissionPlugin.class);
        registerPlugin(AppUpdatePlugin.class);
        super.onCreate(savedInstanceState);

        View fadeOverlay = findViewById(R.id.webViewFadeOverlay);
        if (fadeOverlay == null) return;

        fadeOverlay.postDelayed(() -> fadeOverlay.animate()
            .alpha(0f)
            .setDuration(WEBVIEW_FADE_DURATION_MS)
            .withEndAction(() -> fadeOverlay.setVisibility(View.GONE))
            .start(), WEBVIEW_FADE_DELAY_MS);
    }
}
