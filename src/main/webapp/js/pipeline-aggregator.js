function format_date(dt) {
   return dt.getFullYear() + '-' + (dt.getMonth() < 9 ? '0' : '') + (dt.getMonth() + 1) + '-' + (dt.getDate() < 10 ? '0' : '') + dt.getDate() + ' ' + (dt.getHours() < 10 ? '0' : '') + dt.getHours() + ':' + (dt.getMinutes() < 10 ? '0' : '') + dt.getMinutes() + ':' + (dt.getSeconds() < 10 ? '0' : '') + dt.getSeconds();
}
$.ajaxSetup({
   async: false
});
function format_interval(iv) {
   if (iv < 1000) {
      return iv + 'ms';
   }

   ivStr = '';
   // Days
   if (iv > 86400000) {
      ivStr = Math.floor(iv / 86400000) + 'd';
      iv = iv - Math.floor(iv / 86400000) * 86400000;
   }
   // Hours
   if (iv > 3600000) {
      ivStr += ' ' + Math.floor(iv / 3600000) + 'h';
      iv = iv - Math.floor(iv / 3600000) * 3600000;
   }
   // Minutes
   if (iv > 60000) {
      ivStr += ' ' + Math.floor(iv / 60000) + 'm';
      iv = iv - Math.floor(iv / 60000) * 60000;
   }
   // Seconds
   if (iv > 1000) ivStr += ' ' + Math.floor(iv / 1000) + 's';
   return ivStr;
}

function escapeUntrustedHtml(str) {
   return $('<div>').text(str).html();
}

function reload_jenkins_build_history(tableSelector, viewURL, buildHistorySize, useScrollingCommits, onlyLastBuild) {
   $.getJSON(viewURL + 'api/json', function (data) {
      i = 0;
      var newRows = [];
      $.each(data.builds, function (key, val) {
         i++;
         if (i > buildHistorySize) {
            return;
         }
         dt = new Date(val.startTime + val.duration);
         if (useScrollingCommits) {
            var height = $('.btn-group').height();
            if (height === null) {
               height = '41px';
            }
            authors = '<div class="marqueeClass" style="height:' + height + '" >' + '<marquee direction="up" scrollamount="2">'
         } else {
            authors = '<div>'
         }
         jobName = val.buildName.replace(/(.*) #.*/, '$1');
         blueURL = '/blue/rest/organizations/jenkins/pipelines/' + jobName + '/runs/' + val.number + '/nodes/';
         bame = '<a href="' + val.url + '" class="job-title">' + escapeUntrustedHtml(val.buildName) + '</a>';
         stages = '<div class="btn-group" role="group">'

         $.getJSON(blueURL, function (data) {
            if (data.length > 0) {
               for (stage in data) {
                  switch (data[stage].result) {
                     case 'SUCCESS':
                        classes = 'btn-success';
                        tableClass = 'sucess'
                        break;
                     case 'FAILED':
                        classes = 'btn-danger'
                        break;
                     case 'ABORTED':
                        classes = 'btn-warning';
                        tableClass = 'warning'
                     case 'UNSTABLE':
                        classes = 'btn-warning';
                        tableClass = 'danger'
                        break;
                     case 'IN_PROGRESS':
                        classes = 'info invert-text-color';
                        tableClass = 'info'
                        break;
                     default:
                        classes = '';
                  }

                  if (stage > 0 && data[stage].type != "PARALLEL") {
                     stages += '</div>'
                  }

                  if (data[stage].type == "PARALLEL") {
                     displayName = data[stage].displayName
                  } else {
                     displayName = "Stage: " + data[stage].displayName
                  }

                  steps_url = '/blue/rest/organizations/jenkins/pipelines/' + jobName + '/runs/' + val.number + '/nodes/' + data[stage].id + '/steps/'
                  $.getJSON(steps_url, function (data) {
                     dashboard = '';
                     for (step in data) {
                        displayDescription = String(data[step].displayDescription);
                        if (displayDescription.startsWith('dashboard:')) {
                           dashboard = displayDescription.split(':').pop();
                           break;
                        }
                     }
                  });

                  if (data[stage].type == "PARALLEL") {
                     stages += '<button type="button" class="btn ' + classes + '">' + '<span style="font-size:100%;">' + escapeUntrustedHtml(displayName) + '</span><br><span style="font-size:60%;">' + escapeUntrustedHtml(dashboard) + '</span></button>';
                  } else {
                     stages += '<div class="btn-group' + stage + '" role="group"><button type="button" class="btn ' + classes + '">' + '<span style="font-size:100%;">' + escapeUntrustedHtml(displayName) + '</span><br><span style="font-size:60%;">' + escapeUntrustedHtml(dashboard) + '</span></button>';
                  }
               }
               stages += '</div>'
            }
            stages += '</div>'


            newRow = '<tr><td class="job-wrap text-left">' + bame + '</td><td class="text-left">' + stages + '</td>';
            if (showCommitInfo) {
               newRow += '<td>' + authors + '</td>';
            }
            if (showDescription) {
               newRow += '<td>' + val.description + '</td>';
            }
            if (showBuildTime) {
               newRow += '<td>' + format_date(dt) + '</td>';
            }
            if (showBuildDuration) {
               newRow += '<td>' + format_interval(val.duration) + '</td>';
            }
            newRow += '</tr>';
            $(tableSelector + ' tbody').append(newRow);
            newRows.push($(newRow));

         });



         // stages
         // $.getJSON(url + "wfapi/describe", function (data) {
         //    if (typeof data.stages !== 'undefined' && data.stages.length > 0) {
         //       var changeSet = val.changeLogSet;
         //       if (typeof data._links.changesets !== 'undefined') {
         //          for (var i = 0; i < changeSet.length; i++) {
         //             text = '<strong>' + escapeUntrustedHtml(changeSet[i].author) + '</strong> ' + escapeUntrustedHtml(changeSet[i].message) + '</br>'
         //             authors += text;
         //          }
         //       } else {
         //          authors += 'No Changes'
         //       }
         //       if (useScrollingCommits) {
         //          authors += '</marquee>' + '</div>';
         //       } else
         //          authors += '</div>'
         //       for (stage in data.stages) {
         //          switch (data.stages[stage].status) {
         //             case 'SUCCESS':
         //                classes = 'btn-success';
         //                tableClass = 'sucess'
         //                break;
         //             case 'FAILED':
         //                classes = 'btn-danger'
         //                break;
         //             case 'ABORTED':
         //                classes = 'btn-warning';
         //                tableClass = 'warning'
         //             case 'UNSTABLE':
         //                classes = 'btn-warning';
         //                tableClass = 'danger'
         //                break;
         //             case 'IN_PROGRESS':
         //                classes = 'info invert-text-color';
         //                tableClass = 'info'
         //                break;
         //             default:
         //                classes = '';
         //          }

         //          // stage
         //          $.getJSON(url + 'execution/node/' + data.stages[stage].id + "/wfapi/describe", function (data) {
         //             dashboard = '&nbsp;';
         //             for (stageFlow in data.stageFlowNodes) {
         //                if ('parameterDescription' in data.stageFlowNodes[stageFlow]) {
         //                   description = data.stageFlowNodes[stageFlow].parameterDescription;
         //                   if (description.startsWith('dashboard:')) {
         //                      dashboard = description.split(':').pop();
         //                      break;
         //                   }
         //                }
         //             }
         //          });

         //          stages += '<button type="button" class="btn ' + classes + '">' + '<span style="font-size:100%;">' + escapeUntrustedHtml(data.stages[stage].name) + '</span><br><span style="font-size:60%;">' + escapeUntrustedHtml(dashboard) + '</span></button>';
         //       }
         //    }
         //    stages += '</div>'


         //    newRow = '<tr><td class="job-wrap text-left">' + bame + '</td><td class="text-left">' + stages + '</td>';
         //    if (showCommitInfo) {
         //       newRow += '<td>' + authors + '</td>';
         //    }
         //    if (showDescription) {
         //       newRow += '<td>' + val.description + '</td>';
         //    }
         //    if (showBuildTime) {
         //       newRow += '<td>' + format_date(dt) + '</td>';
         //    }
         //    if (showBuildDuration) {
         //       newRow += '<td>' + format_interval(val.duration) + '</td>';
         //    }
         //    newRow += '</tr>';
         //    $(tableSelector + ' tbody').append(newRow);
         //    newRows.push($(newRow));

         // });
      });
      // Remove all existing rows
      $(tableSelector + ' tbody').find('tr').remove();
      $(tableSelector + ' tbody').append(newRows);
   });
}

