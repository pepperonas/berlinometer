package io.celox.application.model;

import java.sql.Timestamp;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
public class ApiLog {

    private long id;
    private String recipe;
    private String uuid;
    private String title;
    private Timestamp timestamp;
    private String type;
    private boolean active;

    public ApiLog(long id, String recipe, String uuid, boolean active) {
        this.id = id;
        this.recipe = recipe;
        this.uuid = uuid;
        this.active = active;
    }

    public ApiLog(long id, String recipe, String uuid, String title, Timestamp timestamp, String type, boolean isActive) {
        this.id = id;
        this.recipe = recipe;
        this.uuid = uuid;
        this.title = title;
        this.timestamp = timestamp;
        this.type = type;
        this.active = isActive;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getRecipe() {
        return recipe;
    }

    public void setRecipe(String recipe) {
        this.recipe = recipe;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Timestamp getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Timestamp timestamp) {
        this.timestamp = timestamp;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
