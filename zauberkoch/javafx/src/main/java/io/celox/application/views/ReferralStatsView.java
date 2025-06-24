package io.celox.application.views;

import com.vaadin.flow.component.grid.Grid;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.Route;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.SQLException;

import io.celox.application.utils.Const;
import io.celox.application.utils.DbUtils;
import jakarta.annotation.security.PermitAll;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
@Route("referrals")
@PermitAll
public class ReferralStatsView extends VerticalLayout {

    private static final Logger LOGGER = LoggerFactory.getLogger(ReferralStatsView.class);

    public ReferralStatsView() {
        try (Connection connection = DbUtils.getConnection()) {
            Grid<Referral> grid = new Grid<>(Referral.class);
            grid.setItems(DbUtils.loadReferralStats(connection));
            add(grid);
        } catch (SQLException e) {
            Notification.show("Fehler beim Herstellen der Datenbankverbindung: " + e.getMessage(),
                    Const.NOTIFICATION_DURATION_DEFAULT, Notification.Position.BOTTOM_CENTER);
            LOGGER.error("Database connection error", e);
        }
    }

    public static class Referral {
        private final long referrerId;
        private final String referralCode;
        private final int usageCount;

        public Referral(long referrer, String referralCode, int usageCount) {
            this.referrerId = referrer;
            this.referralCode = referralCode;
            this.usageCount = usageCount;
        }

        public long getReferrerId() {return referrerId;}

        public String getReferralCode() {return referralCode;}

        public int getUsageCount() {return usageCount;}
    }
}