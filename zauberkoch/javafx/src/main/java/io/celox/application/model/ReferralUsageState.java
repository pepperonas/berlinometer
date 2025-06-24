package io.celox.application.model;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
public class ReferralUsageState {

    private int usageCount;
    private boolean flag;

    public ReferralUsageState(int usageCount, boolean usageCountFlag) {
        this.usageCount = usageCount;
        this.flag = usageCountFlag;
    }

    public int getUsageCount() {
        return usageCount;
    }

    public void setUsageCount(int usageCount) {
        this.usageCount = usageCount;
    }

    public boolean isFlagValid() {
        return flag;
    }

    public void setFlagValid(boolean flag) {
        this.flag = flag;
    }
}
