const fs = require('fs');
const path = require('path');

const doctorPath = path.join(__dirname, 'frontend/src/pages/doctor/DoctorDashboard.jsx');

function fixDoctorSyntax() {
    let content = fs.readFileSync(doctorPath, 'utf8');

    // Pattern:
    // ))}
    // </div>
    // </div>
    // ))}
    // </div>
    // )}

    // We want to replace it with:
    // ))}
    // </div>
    // )}

    // Using regex that allows for whitespace variations
    const regex = /\}\)\)\s*<\/div>\s*<\/div>\s*\}\)\)\s*<\/div>\s*\)\}/;

    if (regex.test(content)) {
        console.log('Found broken syntax block in DoctorDashboard.jsx');
        const replacement = `                                    ))}
                            </div>
                        )}
        `;
        // We might need to match the indentation of the previous lines to be nice, 
        // but for now let's just fix the syntax.
        // Actually, let's just target the specific repeated block.

        content = content.replace(regex, '}))</div>)}');
        // The above replacement might mess up indentation, let's try to be cleaner or just accept it's fixed.
        // Better replacement:
        // content = content.replace(regex, '                                    ))}\n                            </div>\n                        )}');

        fs.writeFileSync(doctorPath, content, 'utf8');
        console.log('Fixed DoctorDashboard.jsx syntax');
    } else {
        console.log('Broken syntax block NOT found in DoctorDashboard.jsx via regex');

        // Let's try to debug what's there
        const partial = content.substring(content.indexOf('myCreatedRecords.map'));
        // console.log(partial.substring(0, 500)); 
    }
}

fixDoctorSyntax();
