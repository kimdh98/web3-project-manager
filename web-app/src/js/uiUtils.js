function openTab(evt, tabId) {
    // Get all tab content elements
    var tabContent = document.getElementsByClassName("tab-pane");
  
    // Hide all tab content
    for (var i = 0; i < tabContent.length; i++) {
      tabContent[i].style.display = "none";
    }
  
    // Remove the "active" class from all tab headers
    var tabHeaders = document.getElementsByClassName("tab");
    for (var i = 0; i < tabHeaders.length; i++) {
      tabHeaders[i].className = tabHeaders[i].className.replace(" active", "");
    }
  
    // Show the selected tab content
    document.getElementById(tabId).style.display = "block";
  
    // Add the "active" class to the clicked tab header
    evt.currentTarget.className += " active";
}
  