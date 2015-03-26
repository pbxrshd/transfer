// require['jquery']
"use strict";
var DATAGEN = (function() {
  //
  function randomInts(min, max, count) {
    count = count || 1;
    var ints = [];
    for (var i = 0;i < count; i++) {
      //ints.push(Math.floor((Math.random() * max) + min));
      ints.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return ints;
  }
  //
  function randomFloats(min, max, count) {
    var floats = [];
    randomInts(100*min, 100*max, count).forEach(function(e) {
      floats.push(e/100.0);
    });
    return floats;
  }
  // count must be <= NAMES.length
  function randomNames(count) {
    var names = [];
    randomInts(0, 99, count).forEach(function(e) {
        names.push(NAMES[e]);
    });
    /*
    while (names.length < count) {
      var name = NAMES[Math.floor(Math.random() * (NAMES.length + 1))];
      if (names.indexOf(name) === -1) {
        names.push(name);
      }
    } 
    */
    return names;
  }
  //  
  var NAMES = ["Chargeback No Loss",
"Deduct from Settlement",
"Courtesy Refund",
"Unpaid Credit",
"Seller Fraud Loss",
"Allow",
"Accept",
"Allow Bulk",
"Bulk Release",
"Authorization Form 2",
"Valid - Add to Postiive File",
"Revoked",
"Fraud",
"Hostile Fraud Declined",
"Abuse",
"Hostile Fraud - Accnt T.O.",
"Hostile Fraud ATO Recovered",
"Hostile Fraud ATO Missed",
"Hostile Fraud Recovered",
"Hostile Fraud Prevented - Confirmed",
"Hostile Fraud Missed - Unconfirmed",
"Chargeback Received",
"Bulk Release Low Score",
"Suspended- Fraud",
"Friendly Fraud Flown",
"Friendly Fraud Prevented",
"Fraud Email Pattern",
"Bulk Release",
"Fraud",
"Auto Release",
"Missed Event - Already Flown",
"Release w/ Contact",
"Discontinued By Manufacturer",
"CANCEL: Customer Request",
"Cancel: Reject Fraud Review",
"Cancel Transaction",
"Approve (ACH)",
"Violated Policy",
"Bank Confirmed Fraud",
"Canceled After Fraud Check",
"KYC Review - Approve",
"Hostile Fraud Missed",
"Refund",
"Remove from Queue",
"Release",
"Cancel: Known Fraud",
"Denied Friendly Fraud",
"CC Decline",
"Denied in Error",
"Conditionally Approved",
"Changed PID and Approved",
"Chargeback Reviewed",
"Hostile Fraud Missed - Refunded",
"Auto Cancelled",
"CC Decline",
"Cancel Test Order",
"Cancelled CSR",
"Chargeback Friendly",
"Chargeback Flagged",
"Chargeback- Not Fraud",
"Accept - Call Customer",
"Return to Queue",
"Accept - Review",
"Accept - Rules",
"Refund",
"Buyer/Seller Fraud Prevented",
"Remove from Queue",
"Remove from Queue Bulk",
"Rejected T & C Violation",
"Routine Transaction",
"Confirmed Fraud",
"Fraud Loss",
"Possible Fraud (Approved)",
"Incomplete Order",
"AVS Cancellation - No Response",
"Cancel-no response",
"Fraud missed-cardholder or bank called",
"Fraud prevented-intercept succeeded",
"Chargeback Loss Insufficient Support",
"BBPOS IT",
"BBPOS District Manager",
"Missed Event",
"do not use",
"Hostile Fraud Missed - FWC Fail",
"Hostile Fraud Missed - FWC Fail",
"KYC",
"Fraud missed - Ebook",
"Suspend Seller (Direct Customer Contact)",
"Ban Seller (Direct Customer Contact)",
"Remove Bad Check Hold",
"Release",
"Lookout - No Match",
"Duplicate Order",
"CANCEL: Negative Activity",
"CANCEL UV: Unverifiable Info",
"CANCEL: System Error",
"CANCEL NR: No Response",
"Existing Account",
"Auto Accept"];
    

  return {
    randomInts : randomInts,
    randomFloats : randomFloats,
    randomNames : randomNames
  };
})();


