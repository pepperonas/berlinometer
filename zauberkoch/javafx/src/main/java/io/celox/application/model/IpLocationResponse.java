package io.celox.application.model;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Datenmodell für die Antwort von IP-API
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class IpLocationResponse {
    private String status;
    private String message;
    private String country;
    private String region;
    private String city;
    private String district;
    private String isp;
    private String org;
    private boolean mobile;
    private String query;

    // Getter und Setter
    public String getStatus() {return status;}

    public void setStatus(String status) {this.status = status;}

    public String getMessage() {return message;}

    public void setMessage(String message) {this.message = message;}

    public String getCountry() {return country;}

    public void setCountry(String country) {this.country = country;}

    public String getRegion() {return region;}

    public void setRegion(String region) {this.region = region;}

    public String getCity() {return city;}

    public void setCity(String city) {this.city = city;}

    public String getDistrict() {return district;}

    public void setDistrict(String district) {this.district = district;}

    public String getIsp() {return isp;}

    public void setIsp(String isp) {this.isp = isp;}

    public String getOrg() {return org;}

    public void setOrg(String org) {this.org = org;}

    public boolean isMobile() {return mobile;}

    @JsonProperty("mobile")
    public void setMobile(boolean mobile) {this.mobile = mobile;}

    public String getQuery() {return query;}

    public void setQuery(String query) {this.query = query;}
}
