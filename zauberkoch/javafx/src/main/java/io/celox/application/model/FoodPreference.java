package io.celox.application.model;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
public class FoodPreference {

    long id;
    String name;
    boolean liked = false;

    public FoodPreference(String name, boolean liked) {
        this.id = id;
        this.name = name;
        this.liked = liked;
    }

    public FoodPreference(long id, String name, boolean liked) {
        this.id = id;
        this.name = name;
        this.liked = liked;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isLiked() {
        return liked;
    }

    public void setLiked(boolean liked) {
        this.liked = liked;
    }

    @Override
    public String toString() {
        return "FoodPreference{" +
               "id=" + id +
               ", name='" + name + '\'' +
               ", liked=" + liked +
               '}';
    }
}
