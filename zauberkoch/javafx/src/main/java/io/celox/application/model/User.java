package io.celox.application.model;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
public class User {

    private int id;
    private boolean active;
    private boolean admin;
    private String username;
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private Date birthDate;
    private String gender;
    private float weight;
    private int nationality;
    private java.util.Date created;
    private java.util.Date lastSeen;
    private java.util.Date premiumExpiration;
    private String subscriptionId;
    private long lastMeal;
    private boolean verified;
    private int execCount;
    private int referralsCount;
    private boolean googleOauth = false;

    public User() {

    }

    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }

    public User(int id, String username, Timestamp premiumExpiration, String subscriptionId) {
        this.id = id;
        this.username = username;
        this.premiumExpiration = premiumExpiration;
        this.subscriptionId = subscriptionId;
    }

    public User(int id, int active, int admin, String username, String email, String password,
                String firstName, String lastName, java.util.Date premiumExpiration, java.util.Date lastSeen,
                Date birthDate, String gender, int verified) {
        this.id = id;
        this.active = active == 1;
        this.admin = admin == 1;
        this.username = username;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.premiumExpiration = premiumExpiration;
        this.lastSeen = lastSeen;
        this.birthDate = birthDate;
        this.gender = gender;
        this.verified = verified == 1;
    }

    public User(int id, int active, int admin, String username, String email, String password,
                String firstName, String lastName,
                java.util.Date created, java.util.Date premiumExpiration, java.util.Date lastSeen,
                Date birthDate, String gender, int verified, boolean googleOauth) {
        this.id = id;
        this.active = active == 1;
        this.admin = admin == 1;
        this.username = username;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.created = created;
        this.premiumExpiration = premiumExpiration;
        this.lastSeen = lastSeen;
        this.birthDate = birthDate;
        this.gender = gender;
        this.verified = verified == 1;
        this.googleOauth = googleOauth;
    }

    public User(int id, String username, String email, String firstName, String lastName,
                Timestamp created, java.util.Date premiumExpiration, java.util.Date lastSeen, boolean admin, boolean verified,
                int execCount) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.created = created;
        this.premiumExpiration = premiumExpiration;
        this.lastSeen = lastSeen;
        this.admin = admin;
        this.verified = verified;
        this.execCount = execCount;
        this.referralsCount = referralsCount;
    }

    public User(int id, String username, String email, String firstName, String lastName,
                Timestamp created, java.util.Date premiumExpiration, java.util.Date lastSeen, boolean admin, boolean verified,
                int execCount, boolean googleOauth) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.created = created;
        this.premiumExpiration = premiumExpiration;
        this.lastSeen = lastSeen;
        this.admin = admin;
        this.verified = verified;
        this.execCount = execCount;
        this.referralsCount = referralsCount;
        this.googleOauth = googleOauth;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isAdmin() {
        return admin;
    }

    public void setAdmin(boolean admin) {
        this.admin = admin;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public Date getBirthDate() {
        return birthDate;
    }

    public LocalDate getBirthDateLocalDate() {
        return (birthDate != null) ? birthDate.toLocalDate() : null; // ✅ Sicherer Fix

    }

    public void setBirthDate(Date birthDate) {
        this.birthDate = birthDate;
    }

    public void setBirthDateLocalDate(LocalDate birthDate) {
        this.birthDate = (birthDate != null) ? Date.valueOf(birthDate) : null; // ✅ Sicher für SQL
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public float getWeight() {
        return weight;
    }

    public void setWeight(float weight) {
        this.weight = weight;
    }

    public int getNationality() {
        return nationality;
    }

    public void setNationality(int nationality) {
        this.nationality = nationality;
    }

    public java.util.Date getCreated() {
        return created;
    }

    public void setCreated(java.util.Date created) {
        this.created = created;
    }

    public java.util.Date getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(java.util.Date lastSeen) {
        this.lastSeen = lastSeen;
    }

    public java.util.Date getPremiumExpiration() {
        return premiumExpiration;
    }

    public void setPremiumExpiration(java.util.Date premiumExpiration) {
        this.premiumExpiration = premiumExpiration;
    }

    public String getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(String subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public long getLastMeal() {
        return lastMeal;
    }

    public void setLastMeal(long lastMeal) {
        this.lastMeal = lastMeal;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public int getExecCount() {
        return execCount;
    }

    public void setExecCount(int execCount) {
        this.execCount = execCount;
    }

    public int getReferralsCount() {
        return referralsCount;
    }

    public void setReferralsCount(int referralsCount) {
        this.referralsCount = referralsCount;
    }

    public boolean isGoogleOauth() {
        return googleOauth;
    }

    public void setGoogleOauth(boolean googleOauth) {
        this.googleOauth = googleOauth;
    }

    @Override
    public String toString() {
        return "User{" +
               "id=" + id +
               ", active=" + active +
               ", admin=" + admin +
               ", username='" + username + '\'' +
               ", email='" + email + '\'' +
               ", password='" + password + '\'' +
               ", firstName='" + firstName + '\'' +
               ", lastName='" + lastName + '\'' +
               ", birthDate=" + birthDate +
               ", gender='" + gender + '\'' +
               ", weight=" + weight +
               ", nationality=" + nationality +
               ", created=" + created +
               ", lastSeen=" + lastSeen +
               ", premiumExpiration=" + premiumExpiration +
               ", subscriptionId='" + subscriptionId + '\'' +
               ", lastMeal=" + lastMeal +
               ", verified=" + verified +
               ", execCount=" + execCount +
               ", referralsCount=" + referralsCount +
               ", googleOauth=" + googleOauth +
               '}';
    }
}
